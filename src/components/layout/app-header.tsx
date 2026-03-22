"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";

import { getSuggestionHref } from "@/lib/catalog/format";
import type { SearchSuggestionData } from "@/lib/catalog/types";
import { resolveMediaPath } from "@/lib/media";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type AppHeaderProps = {
  pageTitle: string;
  cartCount: number;
  onOpenSidebar: () => void;
  showMenuButton?: boolean;
  showProfileButton?: boolean;
};

function getSuggestionMeta(item: SearchSuggestionData): string {
  if (item.type === "book") {
    return `Книга • ${(item.price ?? 0).toFixed(2)} грн`;
  }

  return "Автор";
}

export function AppHeader({
  pageTitle,
  cartCount,
  onOpenSidebar,
  showMenuButton = true,
  showProfileButton = true,
}: AppHeaderProps) {
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

  const showSuggestions = focused && query.trim().length >= 2;

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
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 mobile:gap-l mobile:px-10 mobile:py-m desktop:h-[var(--layout-header-height)] desktop:flex-nowrap desktop:px-10 desktop:py-0 compact:px-[60px]">
        {showMenuButton ? (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="app-shell-control order-1 inline-flex h-11 w-11 items-center justify-center rounded-full border text-app-primary transition-[color,background-color,border-color,transform,box-shadow] duration-fast hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-app-body active:translate-y-0 desktop:hidden"
            aria-label="Відкрити меню"
          >
            <Menu size={16} />
          </button>
        ) : null}

        {!showMenuButton && showProfileButton ? (
          <Link
            href="/profile"
            aria-label="Перейти до профілю"
            className="app-shell-control order-1 inline-flex h-11 w-11 items-center justify-center rounded-full border text-app-primary transition-[color,background-color,border-color,transform,box-shadow] duration-fast hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-app-body active:translate-y-0 desktop:hidden"
          >
            <UserRound size={16} />
          </Link>
        ) : null}

        <h1 className="order-2 min-w-0 flex-1 truncate px-1 pt-[1px] font-display text-[22px] font-normal leading-[1.08] text-app-primary mobile:text-[30px] desktop:flex-none desktop:px-0 desktop:text-[30px] compact:text-[36px]">
          {pageTitle}
        </h1>

        <form
          onSubmit={submitGlobalSearch}
          className="relative order-5 w-full pt-1 desktop:order-2 desktop:ml-auto desktop:max-w-[300px] desktop:pt-0"
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
               className="h-[40px] w-full border-b border-[color:var(--color-shell-search-border)] bg-transparent px-0 font-body text-sm text-app-primary outline-none placeholder:text-app-secondary transition-[color,border-color,box-shadow] duration-fast focus:border-app-border-hover focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-app-body desktop:h-[42px]"
              />
            </div>

          <AnimatePresence>
            {showSuggestions ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.99 }}
                transition={{ duration: 0.18 }}
                className="app-shell-surface absolute left-0 top-full z-50 mt-s w-full overflow-hidden rounded-soft border border-app-border-light"
              >
                <ul className="max-h-[320px] overflow-y-auto p-1">
                  {suggestionsLoading ? (
                    <li className="px-s py-s font-body text-xs uppercase tracking-[0.12em] text-app-muted">
                      Пошук...
                    </li>
                  ) : null}

                  {!suggestionsLoading && suggestions.length === 0 ? (
                    <li className="px-s py-s font-body text-xs uppercase tracking-[0.12em] text-app-muted">
                      Нічого не знайдено
                    </li>
                  ) : null}

                  {suggestions.map((item) => {
                    const imageSource = resolveMediaPath(item.imagePath);

                    return (
                      <li key={`${item.type}-${item.id}`}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-s rounded-soft px-s py-s text-left transition-[background-color,color,transform] duration-fast hover:bg-app-hover focus-visible:bg-app-hover"
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

        <ThemeToggle className="order-3 desktop:order-3 desktop:ml-s" />

        <Link
          href="/cart"
          aria-label="Перейти до кошика"
          className="app-shell-control order-4 inline-flex h-11 w-11 flex-none items-center justify-center rounded-full border text-app-primary transition-[color,background-color,border-color,transform,box-shadow] duration-fast hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-app-body active:translate-y-0 desktop:ml-s desktop:h-10 desktop:w-10 desktop:bg-transparent desktop:shadow-none desktop:backdrop-blur-0"
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
