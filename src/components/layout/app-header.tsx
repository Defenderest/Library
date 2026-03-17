"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";

import { getSuggestionHref } from "@/lib/catalog/format";
import type { SearchSuggestionData } from "@/lib/catalog/types";
import { resolveMediaPath } from "@/lib/media";

type AppHeaderProps = {
  pageTitle: string;
  cartCount: number;
  onOpenSidebar: () => void;
};

function getSuggestionMeta(item: SearchSuggestionData): string {
  if (item.type === "book") {
    return `Книга • ${(item.price ?? 0).toFixed(2)} грн`;
  }

  return "Автор";
}

export function AppHeader({ pageTitle, cartCount, onOpenSidebar }: AppHeaderProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestionData[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!focused || normalizedQuery.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timerId = window.setTimeout(async () => {
      try {
        setSuggestionsLoading(true);
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(normalizedQuery)}&limit=8`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Не вдалося отримати підказки");
        }

        const data = (await response.json()) as { suggestions?: SearchSuggestionData[] };
        setSuggestions(data.suggestions ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Search suggestions request failed:", error);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSuggestionsLoading(false);
        }
      }
    }, 140);

    return () => {
      controller.abort();
      window.clearTimeout(timerId);
    };
  }, [focused, query]);

  const showSuggestions =
    focused && query.trim().length >= 2 && (suggestions.length > 0 || suggestionsLoading);

  const submitGlobalSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = query.trim();
    if (normalizedQuery.length === 0) {
      router.push("/books");
      return;
    }

    router.push(`/books?q=${encodeURIComponent(normalizedQuery)}`);
  };

  const openSuggestion = (item: SearchSuggestionData) => {
    setQuery(item.displayText);
    setFocused(false);
    setSuggestions([]);
    router.push(getSuggestionHref(item));
  };

  const handleEscape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setFocused(false);
      setSuggestions([]);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-app-border-light bg-transparent">
      <div className="flex flex-wrap items-center gap-s px-4 py-s mobile:gap-l mobile:px-10 mobile:py-m desktop:h-[var(--layout-header-height)] desktop:flex-nowrap desktop:px-[60px] desktop:py-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-app-border-light text-app-primary transition duration-fast hover:border-app-border-hover desktop:hidden"
          aria-label="Відкрити меню"
        >
          <Menu size={16} />
        </button>

        <h1 className="order-1 min-w-0 flex-1 truncate font-display text-[24px] font-normal leading-none text-app-primary mobile:text-[30px] desktop:flex-none desktop:text-[36px]">
          {pageTitle}
        </h1>

        <form
          onSubmit={submitGlobalSearch}
          className="order-3 w-full desktop:order-2 desktop:ml-auto desktop:max-w-[300px]"
        >
          <label htmlFor="global-search" className="sr-only">
            Пошук книг та авторів
          </label>

          <div className="relative">
            <input
              id="global-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setFocused(false), 120);
              }}
              placeholder="Пошук..."
              onKeyDown={handleEscape}
              className="h-[42px] w-full border-b border-[#333] bg-transparent px-0 font-body text-sm text-app-primary outline-none placeholder:text-app-secondary transition duration-fast focus:border-app-white"
            />
          </div>

          <AnimatePresence>
            {showSuggestions ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.99 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 top-full z-50 mt-s w-full overflow-hidden rounded-soft border border-app-border-light bg-[rgba(8,8,8,0.96)] shadow-glass"
              >
                <ul className="max-h-[320px] overflow-y-auto p-1">
                  {suggestionsLoading ? (
                    <li className="px-s py-s font-body text-xs uppercase tracking-[0.12em] text-app-muted">
                      Пошук...
                    </li>
                  ) : null}

                  {suggestions.map((item) => {
                    const imageSource = resolveMediaPath(item.imagePath);

                    return (
                      <li key={`${item.type}-${item.id}`}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-s rounded-soft px-s py-s text-left transition duration-fast hover:bg-app-hover"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            openSuggestion(item);
                          }}
                        >
                          <span className="relative flex h-[34px] w-[34px] flex-none items-center justify-center overflow-hidden rounded-[6px] border border-app-border-light bg-app-card font-body text-[10px] uppercase tracking-[0.2em] text-app-secondary">
                            {imageSource ? (
                              <img src={imageSource} alt={item.displayText} className="h-full w-full object-cover" />
                            ) : (
                              <>{item.type === "book" ? "B" : "A"}</>
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-body text-[13px] text-app-primary">
                              {item.displayText}
                            </span>
                            <span className="block truncate font-body text-[10px] uppercase tracking-[0.14em] text-app-muted">
                              {getSuggestionMeta(item)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </form>

        <Link
          href="/cart"
          prefetch={false}
          aria-label="Перейти до кошика"
          className="order-2 ml-auto inline-flex h-10 w-10 flex-none items-center justify-center rounded-full border border-app-border-light text-app-primary transition duration-fast hover:border-app-border-hover desktop:order-3 desktop:ml-s"
        >
          <ShoppingBag size={15} />

          {cartCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-app-white px-1 font-body text-[10px] font-semibold text-app-body">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
