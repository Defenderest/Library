"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Filter, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

  const displayGenres = useMemo(() => ["Всі", ...genres], [genres]);
  const displayLanguages = useMemo(() => ["Будь-яка", ...languages], [languages]);

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
        className="inline-flex h-[45px] items-center gap-m rounded-pill border border-app-border-light bg-white/[0.05] px-6 font-body text-xs uppercase tracking-[0.08em] text-app-primary transition duration-fast hover:bg-white/[0.1]"
      >
        <Filter size={14} />
        Фільтри
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              aria-label="Закрити панель фільтрів"
              className="fixed inset-0 z-40 bg-black/60"
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
              className="fixed inset-y-0 right-0 z-50 w-full max-w-[400px] border-l border-app-border-light bg-app-glass p-l backdrop-blur-[16px]"
            >
              <div className="h-full overflow-y-auto pr-s">
                <div className="flex items-center gap-m">
                  <h2 className="font-display text-[28px] italic text-app-primary">Фільтри</h2>
                  <div className="ml-auto">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-app-primary transition duration-fast hover:bg-white/[0.1]"
                      aria-label="Закрити"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  <section className="space-y-m">
                    <p className="font-body text-[10px] uppercase tracking-[0.08em] text-app-muted">Жанр</p>
                    <div className="flex flex-wrap gap-s">
                      {displayGenres.map((genre) => {
                        const value = genre === "Всі" ? "" : genre;
                        const active = state.genre === value;

                        return (
                          <button
                            type="button"
                            key={genre}
                            onClick={() => setState((current) => ({ ...current, genre: value }))}
                            className={cn(
                              "rounded-pill border px-4 py-2 font-body text-xs transition duration-fast",
                              active
                                ? "border-app-white bg-white/[0.05] text-app-primary"
                                : "border-app-border-light text-app-secondary hover:bg-white/[0.05]",
                            )}
                          >
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-m">
                    <p className="font-body text-[10px] uppercase tracking-[0.08em] text-app-muted">Мова</p>
                    <div className="flex flex-wrap gap-s">
                      {displayLanguages.map((language) => {
                        const value = language === "Будь-яка" ? "" : language;
                        const active = state.language === value;

                        return (
                          <button
                            type="button"
                            key={language}
                            onClick={() => setState((current) => ({ ...current, language: value }))}
                            className={cn(
                              "rounded-pill border px-4 py-2 font-body text-xs transition duration-fast",
                              active
                                ? "border-app-white bg-white/[0.05] text-app-primary"
                                : "border-app-border-light text-app-secondary hover:bg-white/[0.05]",
                            )}
                          >
                            {language}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-m">
                    <p className="font-body text-[10px] uppercase tracking-[0.08em] text-app-muted">
                      Діапазон Ціни (UAH)
                    </p>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-s">
                      <input
                        type="number"
                        min="0"
                        value={state.minPrice}
                        onChange={(event) =>
                          setState((current) => ({ ...current, minPrice: event.target.value }))
                        }
                        placeholder="Мін"
                        className="h-[50px] w-full border border-app-border-light bg-transparent px-4 text-center font-display text-base text-app-primary outline-none placeholder:text-app-muted"
                      />
                      <span className="w-5 border-b border-app-border-light" />
                      <input
                        type="number"
                        min="0"
                        value={state.maxPrice}
                        onChange={(event) =>
                          setState((current) => ({ ...current, maxPrice: event.target.value }))
                        }
                        placeholder="Макс"
                        className="h-[50px] w-full border border-app-border-light bg-transparent px-4 text-center font-display text-base text-app-primary outline-none placeholder:text-app-muted"
                      />
                    </div>
                  </section>

                  <section className="space-y-m">
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

                  <section className="space-y-s pt-6">
                    <button
                      type="button"
                      onClick={applyFilters}
                      className="flex h-[50px] w-full items-center justify-center border border-app-white bg-transparent font-body text-xs uppercase tracking-[0.12em] text-app-primary transition duration-fast hover:bg-app-white hover:text-app-body"
                    >
                      Застосувати
                    </button>

                    <button
                      type="button"
                      onClick={resetFilters}
                      className="flex h-[50px] w-full items-center justify-center border border-app-error bg-transparent font-body text-xs uppercase tracking-[0.12em] text-app-secondary transition duration-fast hover:bg-[rgba(255,68,68,0.2)] hover:text-app-error"
                    >
                      Скинути фільтри
                    </button>
                  </section>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
