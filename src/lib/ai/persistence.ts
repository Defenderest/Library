import { createHash } from "crypto";

import { execute, queryFirst, queryRows } from "@/lib/db/raw";
import { prisma } from "@/lib/prisma";

export type AiUserMemory = {
  preferredGenres: string[];
  preferredLanguage: string | null;
  maxBudget: number | null;
  updatedAt?: string;
};

export type AiBookSource = {
  bookId: number;
  title: string;
  authors: string;
  genre: string;
  price: number;
  stockQuantity: number;
  href: string;
  score?: number;
  matchReasons?: string[];
};

export type CachedAiResponse = {
  text: string;
  sources: AiBookSource[];
};

type MemoryRow = {
  customerId: number;
  memoryJson: unknown;
  updatedAt: Date | string;
};

type CachedResponseRow = {
  responseJson: unknown;
};

type ChatEventInsertRow = {
  aiChatEventId: bigint | number;
};

type DailyUsageRow = {
  dailyCount: number | null;
};

type AdminAiMetricsRow = {
  totalDialogs: number | null;
  usefulDialogs: number | null;
  convertedDialogs: number | null;
  avgAssistantChars: number | null;
  avgSessionTurns: number | null;
};

type AdminAiTopQueryRow = {
  query: string | null;
  count: number | null;
};

export type AdminAiAnalytics = {
  totalDialogs: number;
  usefulPercent: number;
  conversionPercent: number;
  avgAssistantChars: number;
  avgSessionTurns: number;
  topQueries: Array<{ query: string; count: number }>;
};

const EMPTY_MEMORY: AiUserMemory = {
  preferredGenres: [],
  preferredLanguage: null,
  maxBudget: null,
};

function asNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeGenres(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry) => entry.length > 0),
    ),
  ).slice(0, 6);
}

function parseMemoryJson(value: unknown): AiUserMemory {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_MEMORY };
  }

  const memory = value as Record<string, unknown>;

  const preferredLanguage =
    typeof memory.preferredLanguage === "string" && memory.preferredLanguage.trim().length > 0
      ? memory.preferredLanguage.trim()
      : null;
  const maxBudgetRaw = asNumber(memory.maxBudget);
  const maxBudget = maxBudgetRaw && maxBudgetRaw > 0 ? Number(maxBudgetRaw.toFixed(2)) : null;

  return {
    preferredGenres: normalizeGenres(memory.preferredGenres),
    preferredLanguage,
    maxBudget,
  };
}

function parseCachedResponse(value: unknown): CachedAiResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Record<string, unknown>;
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (text.length === 0) {
    return null;
  }

  const sources: AiBookSource[] = Array.isArray(payload.sources)
    ? payload.sources
        .map((entry): AiBookSource | null => {
          if (!entry || typeof entry !== "object") {
            return null;
          }

          const source = entry as Record<string, unknown>;
          const bookId = Number(source.bookId);
          const title = typeof source.title === "string" ? source.title.trim() : "";

          if (!Number.isInteger(bookId) || bookId <= 0 || title.length === 0) {
            return null;
          }

          const parsedSource: AiBookSource = {
            bookId,
            title,
            authors: typeof source.authors === "string" ? source.authors : "Невідомий автор",
            genre: typeof source.genre === "string" ? source.genre : "",
            price: Number(source.price ?? 0) || 0,
            stockQuantity: Number(source.stockQuantity ?? 0) || 0,
            href: typeof source.href === "string" ? source.href : `/books/${bookId}`,
          };

          if (typeof source.score === "number") {
            parsedSource.score = source.score;
          }

          if (Array.isArray(source.matchReasons)) {
            parsedSource.matchReasons = source.matchReasons.filter(
              (reason): reason is string => typeof reason === "string",
            );
          }

          return parsedSource;
        })
        .filter((entry): entry is AiBookSource => entry !== null)
        .slice(0, 5)
    : [];

  return {
    text,
    sources,
  };
}

export function buildAiCacheKey(payload: {
  message: string;
  sessionId: string;
  customerId: number | null;
  memory: AiUserMemory;
}): string {
  const normalized = JSON.stringify({
    message: payload.message.trim().toLocaleLowerCase("uk-UA"),
    sessionId: payload.sessionId,
    customerId: payload.customerId,
    memory: payload.memory,
    version: 2,
  });

  return createHash("sha256").update(normalized).digest("hex");
}

export async function getAiUserMemory(customerId: number): Promise<AiUserMemory> {
  try {
    const row = await queryFirst<MemoryRow>(prisma, "ai/get_user_memory", [customerId]);
    if (!row) {
      return { ...EMPTY_MEMORY };
    }

    const memory = parseMemoryJson(row.memoryJson);
    const updatedAt = row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt);

    return {
      ...memory,
      updatedAt,
    };
  } catch {
    return { ...EMPTY_MEMORY };
  }
}

export async function saveAiUserMemory(customerId: number, memory: AiUserMemory): Promise<void> {
  const payload = JSON.stringify({
    preferredGenres: normalizeGenres(memory.preferredGenres),
    preferredLanguage: memory.preferredLanguage,
    maxBudget: memory.maxBudget,
  });

  try {
    await execute(prisma, "ai/upsert_user_memory", [customerId, payload]);
  } catch {}
}

export async function getCachedAiResponse(cacheKey: string): Promise<CachedAiResponse | null> {
  try {
    const row = await queryFirst<CachedResponseRow>(prisma, "ai/get_cached_response", [cacheKey]);
    return row ? parseCachedResponse(row.responseJson) : null;
  } catch {
    return null;
  }
}

export async function setCachedAiResponse(
  cacheKey: string,
  response: CachedAiResponse,
  ttlSeconds = 300,
): Promise<void> {
  try {
    await execute(prisma, "ai/upsert_cached_response", [cacheKey, JSON.stringify(response), ttlSeconds]);
  } catch {}
}

export async function cleanupExpiredAiCache(): Promise<void> {
  try {
    await execute(prisma, "ai/delete_expired_cached_responses");
  } catch {}
}

export async function createAiChatEvent(payload: {
  customerId: number | null;
  sessionId: string;
  userMessage: string;
  assistantMessage: string;
}): Promise<number | null> {
  try {
    const row = await queryFirst<ChatEventInsertRow>(prisma, "ai/create_chat_event", [
      payload.customerId,
      payload.sessionId,
      payload.userMessage,
      payload.assistantMessage,
      payload.assistantMessage.length,
    ]);

    if (!row) {
      return null;
    }

    return Number(row.aiChatEventId);
  } catch {
    return null;
  }
}

export async function setAiChatEventUseful(eventId: number, useful: boolean): Promise<void> {
  try {
    await execute(prisma, "ai/mark_chat_event_useful", [eventId, useful]);
  } catch {}
}

export async function markAiChatEventAddToCart(eventId: number): Promise<void> {
  try {
    await execute(prisma, "ai/mark_chat_event_added_to_cart", [eventId]);
  } catch {}
}

export async function getAiDailyUsageCount(customerId: number | null, sessionId: string): Promise<number> {
  try {
    const row = await queryFirst<DailyUsageRow>(prisma, "ai/get_daily_usage_count", [customerId, sessionId]);
    return Math.max(0, Math.floor(Number(row?.dailyCount ?? 0)));
  } catch {
    return 0;
  }
}

export async function getAdminAiAnalytics(): Promise<AdminAiAnalytics> {
  try {
    const metrics = await queryFirst<AdminAiMetricsRow>(prisma, "ai/get_admin_ai_metrics");
    const topQueryRows = await queryRows<AdminAiTopQueryRow>(prisma, "ai/get_admin_ai_top_queries");

    const totalDialogs = Math.max(0, Math.floor(Number(metrics?.totalDialogs ?? 0)));
    const usefulDialogs = Math.max(0, Math.floor(Number(metrics?.usefulDialogs ?? 0)));
    const convertedDialogs = Math.max(0, Math.floor(Number(metrics?.convertedDialogs ?? 0)));

    const usefulPercent = totalDialogs > 0 ? Number(((usefulDialogs / totalDialogs) * 100).toFixed(1)) : 0;
    const conversionPercent =
      totalDialogs > 0 ? Number(((convertedDialogs / totalDialogs) * 100).toFixed(1)) : 0;

    return {
      totalDialogs,
      usefulPercent,
      conversionPercent,
      avgAssistantChars: Number(Number(metrics?.avgAssistantChars ?? 0).toFixed(1)),
      avgSessionTurns: Number(Number(metrics?.avgSessionTurns ?? 0).toFixed(1)),
      topQueries: topQueryRows
        .map((row) => ({
          query: (row.query ?? "").trim(),
          count: Math.max(0, Math.floor(Number(row.count ?? 0))),
        }))
        .filter((row) => row.query.length > 0)
        .slice(0, 8),
    };
  } catch (error) {
    console.warn("Failed to load AI analytics:", error);
    return {
      totalDialogs: 0,
      usefulPercent: 0,
      conversionPercent: 0,
      avgAssistantChars: 0,
      avgSessionTurns: 0,
      topQueries: [],
    };
  }
}
