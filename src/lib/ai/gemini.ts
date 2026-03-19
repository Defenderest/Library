import { AI_TOOL_DECLARATIONS, runAiTool } from "@/lib/ai/tools";

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

function createSystemInstruction(): string {
  return [
    "Ти преміальний книжковий консультант сервісу Library.",
    "Відповідай лише українською мовою.",
    "Твоє завдання - допомагати підібрати книгу за настроєм, жанром, бюджетом, мовою, довжиною читання та нагодою.",
    "Перш ніж називати конкретні книги, авторів, ціни чи наявність, обов'язково використовуй інструменти каталогу.",
    "Не вигадуй книг, авторів, цін, сторінок, наявності або характеристик, яких немає в даних інструментів.",
    "Для рекомендацій спочатку використовуй recommend_books, а потім за потреби уточнюй get_book_details або інші інструменти.",
    "Перевагу віддавай книгам у наявності. Якщо точного збігу немає, чесно скажи про це і запропонуй найближчі реальні альтернативи.",
    "Відповідай стисло, конкретно і корисно.",
    "Для добірок давай 2-4 варіанти.",
    "Кожен варіант подавай з назвою, автором, ціною, коротким поясненням і позначкою про наявність.",
    "Якщо бюджет або жанр не задано, можеш коротко уточнити, але спершу спробуй дати корисну стартову добірку з наявного каталогу.",
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
        parts: [{ text: createSystemInstruction() }],
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

export async function generateAiReply(messages: AiChatMessage[]): Promise<{ text: string; usedTools: string[] }> {
  const apiKey = resolveGeminiApiKey();
  if (apiKey.length === 0) {
    throw new GeminiConfigurationError("Gemini API key is not configured");
  }

  const model = resolveGeminiModel();
  let contents = toGeminiContents(messages);
  const usedTools = new Set<string>();

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const payload = await requestGemini(apiKey, model, contents);
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
