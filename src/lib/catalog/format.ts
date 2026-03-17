import type { SearchSuggestionData } from "@/lib/catalog/types";

export function formatUADate(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function getSuggestionHref(item: SearchSuggestionData): string {
  return item.type === "book" ? `/books/${item.id}` : `/authors/${item.id}`;
}

export function formatResultsLabel(total: number): string {
  if (total <= 0) {
    return "Немає результатів";
  }

  if (total === 1) {
    return "Показано 1 результат";
  }

  if (total < 5) {
    return `Показано ${total} результати`;
  }

  return `Показано ${total} результатів`;
}
