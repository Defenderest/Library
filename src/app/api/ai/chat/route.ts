import { NextResponse } from "next/server";

import {
  GeminiConfigurationError,
  GeminiRequestError,
  generateAiReply,
  type AiChatMessage,
} from "@/lib/ai/gemini";
import {
  buildAiCacheKey,
  cleanupExpiredAiCache,
  createAiChatEvent,
  getAiDailyUsageCount,
  getAiUserMemory,
  getCachedAiResponse,
  saveAiUserMemory,
  setCachedAiResponse,
  type AiBookSource,
} from "@/lib/ai/persistence";
import { createNoResultsFallbackReply, createPromptInjectionReply, enforceAssistantToneAndLength, hasPromptInjectionSignals } from "@/lib/ai/guardrails";
import { formatMemoryForPrompt, mergeAiMemory } from "@/lib/ai/memory";
import { getServerSessionUser } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ChatPayload = {
  sessionId?: string;
  stream?: boolean;
  messages?: Array<{
    role?: string;
    content?: string;
  }>;
};

const MAX_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 1800;
const MAX_DAILY_AI_MESSAGES = 80;
const CACHE_TTL_SECONDS = 300;

type StreamEnvelope =
  | { type: "meta"; eventId: number | null; sources: AiBookSource[]; fromCache: boolean }
  | { type: "chunk"; text: string }
  | { type: "done"; message: string }
  | { type: "error"; error: string; code?: string };

function normalizeRole(value: string): AiChatMessage["role"] | null {
  if (value === "user" || value === "assistant") {
    return value;
  }

  return null;
}

function normalizeMessages(payload: ChatPayload | null): AiChatMessage[] {
  const source = payload?.messages ?? [];

  const normalized = source
    .map((entry) => {
      const role = normalizeRole(String(entry?.role ?? ""));
      const content = String(entry?.content ?? "").trim();

      if (!role || content.length === 0) {
        return null;
      }

      return {
        role,
        content: content.slice(0, MAX_MESSAGE_LENGTH),
      } satisfies AiChatMessage;
    })
    .filter((entry): entry is AiChatMessage => Boolean(entry));

  return normalized.slice(-MAX_MESSAGES);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ChatPayload | null;
  const sessionId = String(body?.sessionId ?? "").trim().slice(0, 80) || "guest-session";
  const messages = normalizeMessages(body);

  if (messages.length === 0) {
    return NextResponse.json({ error: "Вкажіть повідомлення для асистента" }, { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    return NextResponse.json({ error: "Останнє повідомлення має бути від користувача" }, { status: 400 });
  }

  const userText = lastMessage.content;
  const session = await getServerSessionUser();
  const customerId = session?.customerId ?? null;

  if (hasPromptInjectionSignals(userText)) {
    const safeReply = createPromptInjectionReply();
    return NextResponse.json({
      message: safeReply,
      usedTools: [],
      sources: [],
      eventId: null,
    });
  }

  try {
    void cleanupExpiredAiCache();
  } catch {}

  const dailyUsageCount = await getAiDailyUsageCount(customerId, sessionId);
  if (dailyUsageCount >= MAX_DAILY_AI_MESSAGES) {
    return NextResponse.json(
      { error: "Досягнуто ліміту AI-запитів за добу. Спробуйте завтра." },
      { status: 429 },
    );
  }

  const userMemory = customerId ? await getAiUserMemory(customerId) : null;
  const cacheKey = buildAiCacheKey({
    message: userText,
    sessionId,
    customerId,
    memory: userMemory ?? { preferredGenres: [], preferredLanguage: null, maxBudget: null },
  });

  const cached = await getCachedAiResponse(cacheKey);
  if (cached) {
    const responseMessage = enforceAssistantToneAndLength(cached.text);
    return NextResponse.json({
      message: responseMessage,
      usedTools: ["cache_hit"],
      sources: cached.sources,
      eventId: null,
      fromCache: true,
    });
  }

  try {
    const result = await generateAiReply(messages, {
      userMemorySummary: formatMemoryForPrompt(userMemory),
    });

    let responseText = enforceAssistantToneAndLength(result.text);
    const hasSources = result.sources.length > 0;

    if (!hasSources) {
      responseText = createNoResultsFallbackReply();
    }

    const eventId = await createAiChatEvent({
      customerId,
      sessionId,
      userMessage: userText,
      assistantMessage: responseText,
    });

    if (customerId) {
      const nextMemory = mergeAiMemory({
        previousMemory: userMemory ?? { preferredGenres: [], preferredLanguage: null, maxBudget: null },
        userText,
        suggestedSources: result.sources,
      });
      await saveAiUserMemory(customerId, nextMemory);
    }

    await setCachedAiResponse(
      cacheKey,
      {
        text: responseText,
        sources: result.sources,
      },
      CACHE_TTL_SECONDS,
    );

    if (!body?.stream) {
      return NextResponse.json({
        message: responseText,
        usedTools: result.usedTools,
        sources: result.sources,
        eventId,
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const write = (payload: StreamEnvelope) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        };

        write({
          type: "meta",
          eventId,
          sources: result.sources,
          fromCache: false,
        });

        const chunkSize = 80;
        for (let offset = 0; offset < responseText.length; offset += chunkSize) {
          write({ type: "chunk", text: responseText.slice(offset, offset + chunkSize) });
        }

        write({ type: "done", message: responseText });
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json(
        {
          code: "AI_NOT_CONFIGURED",
          error: "AI сервіс не налаштований. Додайте GEMINI_API_KEY і GEMINI_MODEL=gemini-3-flash-preview на сервері.",
        },
        { status: 503 },
      );
    }

    if (error instanceof GeminiRequestError) {
      const status = error.status >= 400 && error.status < 600 ? error.status : 502;
      return NextResponse.json({ error: error.message, sources: [] }, { status });
    }

    console.error("AI chat route error:", error);
    return NextResponse.json({ error: "Не вдалося отримати відповідь асистента" }, { status: 500 });
  }
}
