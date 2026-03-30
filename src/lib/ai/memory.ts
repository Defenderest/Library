import type { AiBookSource, AiUserMemory } from "@/lib/ai/persistence";

const GENRE_KEYWORDS: Array<{ genre: string; patterns: RegExp[] }> = [
  { genre: "Фентезі", patterns: [/фентез/i, /fantasy/i] },
  { genre: "Наукова фантастика", patterns: [/науков.*фантаст/i, /sci[-\s]?fi/i, /science fiction/i] },
  { genre: "Класика", patterns: [/класик/i] },
  { genre: "Сучасна проза", patterns: [/сучасн.*проз/i, /сучасн/i] },
  { genre: "Науково-популярне", patterns: [/нон[-\s]?фікш/i, /не\s+худож/i, /non[-\s]?fiction/i] },
  { genre: "Детектив", patterns: [/детектив/i, /трилер/i] },
];

function detectGenre(text: string): string | null {
  for (const entry of GENRE_KEYWORDS) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return entry.genre;
    }
  }

  return null;
}

function detectLanguage(text: string): string | null {
  if (/україн/i.test(text)) {
    return "українська";
  }

  if (/англ|english/i.test(text)) {
    return "англійська";
  }

  return null;
}

function detectBudget(text: string): number | null {
  const match =
    text.match(/(?:до|не\s*дорожче|бюджет)\s*(\d{2,5})/i) ??
    text.match(/(\d{2,5})\s*(?:грн|uah)/i);

  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function mergeAiMemory(args: {
  previousMemory: AiUserMemory;
  userText: string;
  suggestedSources: AiBookSource[];
}): AiUserMemory {
  const normalizedText = args.userText.trim();
  const previousGenres = args.previousMemory.preferredGenres;

  const detectedGenre = detectGenre(normalizedText);
  const sourceGenre = args.suggestedSources[0]?.genre?.trim() || null;
  const nextGenres = Array.from(
    new Set(
      [detectedGenre, sourceGenre, ...previousGenres]
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry) => entry.length > 0),
    ),
  ).slice(0, 6);

  const detectedLanguage = detectLanguage(normalizedText);
  const nextLanguage = detectedLanguage ?? args.previousMemory.preferredLanguage;

  const detectedBudget = detectBudget(normalizedText);
  const priceFromSource = args.suggestedSources[0]?.price;
  const nextBudget = detectedBudget ?? args.previousMemory.maxBudget ?? (priceFromSource || null);

  return {
    preferredGenres: nextGenres,
    preferredLanguage: nextLanguage,
    maxBudget: nextBudget ? Number(nextBudget.toFixed(2)) : null,
  };
}

export function formatMemoryForPrompt(memory: AiUserMemory | null): string {
  if (!memory) {
    return "";
  }

  const parts: string[] = [];

  if (memory.preferredGenres.length > 0) {
    parts.push(`улюблені жанри: ${memory.preferredGenres.join(", ")}`);
  }

  if (memory.preferredLanguage) {
    parts.push(`мова: ${memory.preferredLanguage}`);
  }

  if (memory.maxBudget) {
    parts.push(`орієнтовний бюджет: до ${Math.round(memory.maxBudget)} грн`);
  }

  return parts.join("; ");
}
