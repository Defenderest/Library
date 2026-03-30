const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|rules)/i,
  /system\s+prompt/i,
  /developer\s+message/i,
  /reveal\s+(the\s+)?prompt/i,
  /bypass\s+(safety|guardrails|filters)/i,
  /jailbreak/i,
  /act\s+as\s+.*system/i,
  /do\s+not\s+use\s+tools/i,
];

const MAX_RESPONSE_CHARS = 1500;

export function hasPromptInjectionSignals(text: string): boolean {
  const normalized = text.trim();
  if (normalized.length === 0) {
    return false;
  }

  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function createPromptInjectionReply(): string {
  return [
    "Я не можу змінювати системні правила або ігнорувати захисні обмеження.",
    "Але із задоволенням допоможу з підбором книг за жанром, бюджетом, мовою чи настроєм.",
  ].join(" ");
}

export function enforceAssistantToneAndLength(text: string): string {
  const normalized = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (normalized.length <= MAX_RESPONSE_CHARS) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_RESPONSE_CHARS - 1).trimEnd()}…`;
}

export function createNoResultsFallbackReply(): string {
  return [
    "Не знайшов достатньо релевантних книг у поточному каталозі.",
    "Уточніть, будь ласка, жанр, бажаний бюджет або мову - і я підберу найближчі реальні варіанти.",
  ].join(" ");
}
