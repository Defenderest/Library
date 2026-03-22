"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Filter, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SteppedNumberField } from "@/components/ui/stepped-number-field";
import { cn } from "@/lib/cn";

type FilterState = {
  genre: string;
  language: string;
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
};

type BooksFiltersPanelProps = {
  genres: string[];
  languages: string[];
  initialFilters: FilterState;
  searchQuery: string;
};

function parseNumericInput(value: string): string {
  if (value.trim().length === 0) {
    return "";
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return "";
  }

  return String(parsed);
}

export function BooksFiltersPanel({
  genres,
  languages,
  initialFilters,
  searchQuery,
}: BooksFiltersPanelProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FilterState>(initialFilters);

  useEffect(() => {
    setState(initialFilters);
  }, [initialFilters]);

  const displayGenres = ["Всі", ...genres];
  const displayLanguages = ["Будь-яка", ...languages];
  let selectedFiltersCount = 0;

  if (state.genre) {
    selectedFiltersCount += 1;
  }

  if (state.language) {
    selectedFiltersCount += 1;
  }

  if (parseNumericInput(state.minPrice)) {
    selectedFiltersCount += 1;
  }

  if (parseNumericInput(state.maxPrice)) {
    selectedFiltersCount += 1;
  }

  if (state.inStockOnly) {
    selectedFiltersCount += 1;
  }

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    if (state.genre) {
      params.set("genre", state.genre);
    } else {
      params.delete("genre");
    }

    if (state.language) {
      params.set("language", state.language);
    } else {
      params.delete("language");
    }

    const minPrice = parseNumericInput(state.minPrice);
    if (minPrice) {
      params.set("minPrice", minPrice);
    } else {
      params.delete("minPrice");
    }

    const maxPrice = parseNumericInput(state.maxPrice);
    if (maxPrice) {
      params.set("maxPrice", maxPrice);
    } else {
      params.delete("maxPrice");
    }

    if (state.inStockOnly) {
      params.set("inStock", "1");
    } else {
      params.delete("inStock");
    }

    const queryString = params.toString();
    router.push(queryString.length > 0 ? `${pathname}?${queryString}` : pathname);
    setOpen(false);
  };

  const resetFilters = () => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    params.delete("genre");
    params.delete("language");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("inStock");

    setState({
      genre: "",
      language: "",
      minPrice: "",
      maxPrice: "",
      inStockOnly: false,
    });

    const queryString = params.toString();
    router.push(queryString.length > 0 ? `${pathname}?${queryString}` : pathname);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="app-subtle-surface-strong inline-flex h-[45px] items-center gap-m rounded-pill border border-app-border-light px-6 font-body text-xs uppercase tracking-[0.08em] text-app-primary transition-[color,background-color,border-color,transform,box-shadow] duration-fast hover:-translate-y-[1px] hover:border-app-border-hover hover:bg-app-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-app-body active:translate-y-0"
      >
        <Filter size={14} />
        Фільтри
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              aria-label="Закрити панель фільтрів"
              className="app-overlay-backdrop fixed inset-0 z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="app-shell-surface fixed inset-y-0 right-0 z-[70] w-full max-w-[420px] border-l border-app-border-light backdrop-blur-[18px]"
            >
              <div className="flex h-full flex-col">
                <header className="flex items-center gap-m border-b border-app-border-light px-m py-m">
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">
                      Каталог
                    </p>
                    <h2 className="font-display text-[34px] italic text-app-primary">Фільтри</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="app-subtle-surface-strong ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-app-border-light text-app-primary transition-[background-color,color,transform,border-color] duration-fast hover:border-app-border-hover hover:bg-app-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-app-body active:translate-y-0"
                    aria-label="Закрити"
                  >
                    <X size={18} />
                  </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-m py-m pb-[calc(20px+env(safe-area-inset-bottom))]">
                  <div className="space-y-m">
                    <div className="app-subtle-surface-strong rounded-soft border border-app-border-light p-m">
                      <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">
                        Активні фільтри
                      </p>
                      <p className="mt-2 font-body text-sm text-app-secondary">
                        {selectedFiltersCount > 0
                          ? `Вибрано: ${selectedFiltersCount}`
                          : "Фільтри не застосовано"}
                      </p>
                    </div>

                    <section className="app-subtle-surface rounded-soft border border-app-border-light px-m py-[18px]">
                      <p className="font-body text-[10px] uppercase tracking-[0.1em] text-app-muted">Жанр</p>
                      <div className="mt-3 flex flex-wrap gap-s">
                        {displayGenres.map((genre) => {
                          const value = genre === "Всі" ? "" : genre;
                          const active = state.genre === value;

                          return (
                            <button
                              type="button"
                              key={genre}
                              onClick={() => setState((current) => ({ ...current, genre: value }))}
                              className={cn(
                                "rounded-pill border px-4 py-[10px] font-body text-xs transition-[color,background-color,border-color,transform] duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-app-body",
                                active
                                  ? "border-app-border-hover bg-app-hover text-app-primary"
                                  : "border-app-border-light text-app-secondary hover:border-app-border-hover hover:bg-app-hover hover:text-app-primary",
                              )}
                            >
                              {genre}
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className="app-subtle-surface rounded-soft border border-app-border-light px-m py-[18px]">
                      <p className="font-body text-[10px] uppercase tracking-[0.1em] text-app-muted">Мова</p>
                      <div className="mt-3 flex flex-wrap gap-s">
                        {displayLanguages.map((language) => {
                          const value = language === "Будь-яка" ? "" : language;
                          const active = state.language === value;

                          return (
                            <button
                              type="button"
                              key={language}
                              onClick={() => setState((current) => ({ ...current, language: value }))}
                              className={cn(
                                "rounded-pill border px-4 py-[10px] font-body text-xs transition-[color,background-color,border-color,transform] duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-app-body",
                                active
                                  ? "border-app-border-hover bg-app-hover text-app-primary"
                                  : "border-app-border-light text-app-secondary hover:border-app-border-hover hover:bg-app-hover hover:text-app-primary",
                              )}
                            >
                              {language}
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className="app-subtle-surface rounded-soft border border-app-border-light p-m">
                      <p className="font-body text-[10px] uppercase tracking-[0.1em] text-app-muted">
                        Діапазон ціни (UAH)
                      </p>

                      <div className="grid grid-cols-2 gap-s">
                        <label className="space-y-2">
                          <span className="font-body text-[10px] uppercase tracking-[0.1em] text-app-muted">
                            Від
                          </span>
                          <SteppedNumberField
                            value={state.minPrice}
                            onChange={(value) =>
                              setState((current) => ({ ...current, minPrice: value }))
                            }
                            min={0}
                            step={1}
                            placeholder="Мін"
                            inputClassName="app-subtle-surface-soft h-[50px] rounded-sharp font-display text-base focus:bg-app-hover"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="font-body text-[10px] uppercase tracking-[0.1em] text-app-muted">
                            До
                          </span>
                          <SteppedNumberField
                            value={state.maxPrice}
                            onChange={(value) =>
                              setState((current) => ({ ...current, maxPrice: value }))
                            }
                            min={0}
                            step={1}
                            placeholder="Макс"
                            inputClassName="app-subtle-surface-soft h-[50px] rounded-sharp font-display text-base focus:bg-app-hover"
                          />
                        </label>
                      </div>
                    </section>

                    <section className="app-subtle-surface rounded-soft border border-app-border-light p-m">
                      <label className="flex cursor-pointer items-center gap-s font-body text-sm text-app-secondary">
                        <input
                          type="checkbox"
                          checked={state.inStockOnly}
                          onChange={(event) =>
                            setState((current) => ({ ...current, inStockOnly: event.target.checked }))
                          }
                          className="h-4 w-4 rounded border-app-border-light bg-transparent accent-white"
                        />
                        Лише в наявності
                      </label>
                    </section>

                    <footer className="mt-s space-y-s border-t border-app-border-light pt-m">
                      <button
                        type="button"
                        onClick={applyFilters}
                        className="flex h-[52px] w-full items-center justify-center rounded-sharp border border-app-border-hover bg-transparent font-body text-xs uppercase tracking-[0.14em] text-app-primary transition-[color,background-color,border-color,transform,box-shadow] duration-fast hover:-translate-y-[1px] hover:bg-app-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-app-body active:translate-y-0"
                      >
                        Застосувати
                      </button>

                      <button
                        type="button"
                        onClick={resetFilters}
                        className="flex h-[52px] w-full items-center justify-center rounded-sharp border border-app-error bg-transparent font-body text-xs uppercase tracking-[0.14em] text-app-secondary transition-[color,background-color,border-color,transform] duration-fast hover:-translate-y-[1px] hover:bg-app-error/10 hover:text-app-error focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-app-body active:translate-y-0"
                      >
                        Скинути фільтри
                      </button>
                    </footer>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
