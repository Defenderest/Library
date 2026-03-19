import { NextResponse } from "next/server";

import {
  GeminiConfigurationError,
  GeminiRequestError,
  generateAiReply,
  type AiChatMessage,
} from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ChatPayload = {
  messages?: Array<{
    role?: string;
    content?: string;
  }>;
};

const MAX_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 1800;

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
  const messages = normalizeMessages(body);

  if (messages.length === 0) {
    return NextResponse.json({ error: "Вкажіть повідомлення для асистента" }, { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    return NextResponse.json({ error: "Останнє повідомлення має бути від користувача" }, { status: 400 });
  }

  try {
    const result = await generateAiReply(messages);

    return NextResponse.json({
      message: result.text,
      usedTools: result.usedTools,
    });
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json(
        {
          code: "AI_NOT_CONFIGURED",
          error: "AI сервіс тимчасово не налаштований",
        },
        { status: 503 },
      );
    }

    if (error instanceof GeminiRequestError) {
      const status = error.status >= 400 && error.status < 600 ? error.status : 502;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("AI chat route error:", error);
    return NextResponse.json({ error: "Не вдалося отримати відповідь асистента" }, { status: 500 });
  }
}
