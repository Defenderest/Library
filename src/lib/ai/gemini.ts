import { AI_TOOL_DECLARATIONS, runAiTool } from "@/lib/ai/tools";
import type { AiBookSource } from "@/lib/ai/persistence";

export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type GeminiFunctionCall = {
  name?: string;
  args?: Record<string, unknown>;
};

type GeminiPart = {
  text?: string;
  functionCall?: GeminiFunctionCall;
  thoughtSignature?: string;
  thought_signature?: string;
  [key: string]: unknown;
};

type GeminiContent = {
  role: "user" | "model";
  parts: Array<Record<string, unknown>>;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
};

type GeminiGenerateResponse = {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
  };
};

export class GeminiConfigurationError extends Error {}

export class GeminiRequestError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const ENFORCED_GEMINI_MODEL = "gemini-3-flash-preview";
const MAX_TOOL_ROUNDS = 6;
const MAX_SOURCES = 5;

function resolveGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY?.trim() ?? "";
}

function resolveGeminiModel(): string {
  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const model = configuredModel || ENFORCED_GEMINI_MODEL;

  if (model !== ENFORCED_GEMINI_MODEL) {
    throw new GeminiConfigurationError(`AI сервіс має використовувати лише модель ${ENFORCED_GEMINI_MODEL}`);
  }

  return model;
}

function createSystemInstruction(userMemorySummary?: string): string {
  const memoryLine =
    userMemorySummary && userMemorySummary.length > 0
      ? `Персональний контекст користувача: ${userMemorySummary}.`
      : "";

  return [
    "Ти преміальний книжковий консультант сервісу Library.",
    "Відповідай лише українською мовою.",
    "Твоє завдання - допомагати підібрати книгу за настроєм, жанром, бюджетом, мовою, довжиною читання та нагодою.",
    "Перш ніж називати конкретні книги, авторів, ціни чи наявність, обов'язково використовуй інструменти каталогу.",
    "Не вигадуй книг, авторів, цін, сторінок, наявності або характеристик, яких немає в даних інструментів.",
    "Для рекомендацій спочатку використовуй recommend_books, а потім за потреби уточнюй get_book_details або інші інструменти.",
    "У фінальній відповіді згадуй лише ті книги, які реально повернули інструменти.",
    "Не використовуй зовнішні джерела або вигадані назви.",
    "Перевагу віддавай книгам у наявності. Якщо точного збігу немає, чесно скажи про це і запропонуй найближчі реальні альтернативи.",
    "Відповідай стисло, конкретно і корисно.",
    "Для добірок давай 2-4 варіанти.",
    "Кожен варіант подавай з назвою, автором, ціною, коротким поясненням і позначкою про наявність.",
    "Якщо бюджет або жанр не задано, можеш коротко уточнити, але спершу спробуй дати корисну стартову добірку з наявного каталогу.",
    memoryLine,
  ].join(" ");
}

function toGeminiContents(messages: AiChatMessage[]): GeminiContent[] {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function extractText(parts: GeminiPart[]): string {
  return parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
}

function getFunctionCalls(parts: GeminiPart[]): Array<{ name: string; args: Record<string, unknown> }> {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];

  for (const part of parts) {
    const name = part.functionCall?.name?.trim();
    if (!name) {
      continue;
    }

    const args = part.functionCall?.args;
    calls.push({
      name,
      args: args && typeof args === "object" ? args : {},
    });
  }

  return calls;
}

function cloneGeminiPart(part: GeminiPart): Record<string, unknown> {
  const cloned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(part)) {
    if (value !== undefined) {
      cloned[key] = value;
    }
  }

  return cloned;
}

async function requestGemini(
  apiKey: string,
  model: string,
  contents: GeminiContent[],
  userMemorySummary?: string,
): Promise<GeminiGenerateResponse> {
  const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      contents,
      systemInstruction: {
        role: "system",
        parts: [{ text: createSystemInstruction(userMemorySummary) }],
      },
      tools: [
        {
          functionDeclarations: AI_TOOL_DECLARATIONS,
        },
      ],
      toolConfig: {
        functionCallingConfig: {
          mode: "AUTO",
        },
      },
      generationConfig: {
        temperature: 0.2,
        topP: 0.85,
        maxOutputTokens: 800,
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as GeminiGenerateResponse | null;

  if (!response.ok) {
    const message = payload?.error?.message || "Gemini request failed";
    throw new GeminiRequestError(message, response.status);
  }

  if (!payload) {
    throw new GeminiRequestError("Gemini returned an empty response", 502);
  }

  return payload;
}

export function isGeminiConfigured(): boolean {
  return resolveGeminiApiKey().length > 0;
}

function extractToolBooks(result: Record<string, unknown>): AiBookSource[] {
  const candidates: Array<Record<string, unknown>> = [];

  const books = result.books;
  if (Array.isArray(books)) {
    for (const entry of books) {
      if (entry && typeof entry === "object") {
        candidates.push(entry as Record<string, unknown>);
      }
    }
  }

  const singleBook = result.book;
  if (singleBook && typeof singleBook === "object") {
    candidates.push(singleBook as Record<string, unknown>);
  }

  const referenceBook = result.referenceBook;
  if (referenceBook && typeof referenceBook === "object") {
    candidates.push(referenceBook as Record<string, unknown>);
  }

  return candidates
    .map((entry): AiBookSource | null => {
      const bookId = Number(entry.bookId);
      const title = typeof entry.title === "string" ? entry.title.trim() : "";

      if (!Number.isInteger(bookId) || bookId <= 0 || title.length === 0) {
        return null;
      }

      const parsedBook: AiBookSource = {
        bookId,
        title,
        authors: typeof entry.authors === "string" ? entry.authors : "Невідомий автор",
        genre: typeof entry.genre === "string" ? entry.genre : "",
        price: Number(entry.price ?? 0) || 0,
        stockQuantity: Number(entry.stockQuantity ?? 0) || 0,
        href: typeof entry.href === "string" ? entry.href : `/books/${bookId}`,
      };

      if (typeof entry.score === "number") {
        parsedBook.score = entry.score;
      }

      if (Array.isArray(entry.matchReasons)) {
        parsedBook.matchReasons = entry.matchReasons
          .filter((reason): reason is string => typeof reason === "string")
          .slice(0, 3);
      }

      return parsedBook;
    })
    .filter((entry): entry is AiBookSource => entry !== null);
}

export async function generateAiReply(
  messages: AiChatMessage[],
  options?: { userMemorySummary?: string },
): Promise<{ text: string; usedTools: string[]; sources: AiBookSource[] }> {
  const apiKey = resolveGeminiApiKey();
  if (apiKey.length === 0) {
    throw new GeminiConfigurationError("Gemini API key is not configured");
  }

  const model = resolveGeminiModel();
  let contents = toGeminiContents(messages);
  const usedTools = new Set<string>();
  const sourceBooks = new Map<number, AiBookSource>();

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const payload = await requestGemini(apiKey, model, contents, options?.userMemorySummary);
    const candidate = payload.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    if (parts.length === 0) {
      throw new GeminiRequestError("Gemini returned no content", 502);
    }

    const calls = getFunctionCalls(parts);

    if (calls.length === 0) {
      const text = extractText(parts);
      if (text.length === 0) {
        throw new GeminiRequestError("Gemini returned an empty answer", 502);
      }

      return {
        text,
        usedTools: Array.from(usedTools),
        sources: Array.from(sourceBooks.values()).slice(0, MAX_SOURCES),
      };
    }

    contents = [
      ...contents,
      {
        role: "model",
        parts: parts.map(cloneGeminiPart),
      },
    ];

    const functionResponseParts: Array<Record<string, unknown>> = [];

    for (const call of calls) {
      usedTools.add(call.name);

      let result: Record<string, unknown>;

      try {
        result = await runAiTool(call.name, call.args);

        const extractedBooks = extractToolBooks(result);
        for (const book of extractedBooks) {
          if (!sourceBooks.has(book.bookId) && sourceBooks.size < MAX_SOURCES) {
            sourceBooks.set(book.bookId, book);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tool execution failed";
        result = {
          found: false,
          message,
        };
      }

      functionResponseParts.push({
        functionResponse: {
          name: call.name,
          response: result,
        },
      });
    }

    contents = [
      ...contents,
      {
        role: "user",
        parts: functionResponseParts,
      },
    ];
  }

  throw new GeminiRequestError("Gemini tool loop exceeded maximum rounds", 502);
}
