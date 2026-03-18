import Link from "next/link";

import { BookCard } from "@/components/books/book-card";
import { BooksFiltersPanel } from "@/components/books/books-filters-panel";
import { formatResultsLabel } from "@/lib/catalog/format";
import { getBooksCatalog } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

type BooksPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function readSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parseNonNegativeNumber(value: string): number | undefined {
  if (value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function parsePositiveInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);
  pages.add(Math.max(1, currentPage - 1));
  pages.add(Math.max(1, currentPage - 2));
  pages.add(Math.min(totalPages, currentPage + 1));
  pages.add(Math.min(totalPages, currentPage + 2));

  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const query = readSearchParam(searchParams?.q).trim();
  const genre = readSearchParam(searchParams?.genre).trim();
  const language = readSearchParam(searchParams?.language).trim();
  const minPriceText = readSearchParam(searchParams?.minPrice).trim();
  const maxPriceText = readSearchParam(searchParams?.maxPrice).trim();
  const inStockOnly = readSearchParam(searchParams?.inStock) === "1";
  const requestedPage = parsePositiveInteger(readSearchParam(searchParams?.page));

  const { books, genres, languages, page, totalPages, totalCount } = await getBooksCatalog({
    query,
    genre,
    language,
    minPrice: parseNonNegativeNumber(minPriceText),
    maxPrice: parseNonNegativeNumber(maxPriceText),
    inStockOnly,
    page: requestedPage,
    pageSize: 12,
  });

  const buildPageHref = (targetPage: number): string => {
    const params = new URLSearchParams();

    if (query) {
      params.set("q", query);
    }

    if (genre) {
      params.set("genre", genre);
    }

    if (language) {
      params.set("language", language);
    }

    if (minPriceText) {
      params.set("minPrice", minPriceText);
    }

    if (maxPriceText) {
      params.set("maxPrice", maxPriceText);
    }

    if (inStockOnly) {
      params.set("inStock", "1");
    }

    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }

    const queryString = params.toString();
    return queryString.length > 0 ? `/books?${queryString}` : "/books";
  };

  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <section className="relative">
      <div className="flex flex-wrap items-center gap-m">
        <div className="min-w-[120px]">
          <BooksFiltersPanel
            genres={genres}
            languages={languages}
            searchQuery={query}
            initialFilters={{
              genre,
              language,
              minPrice: minPriceText,
              maxPrice: maxPriceText,
              inStockOnly,
            }}
          />
        </div>

        <div className="w-full text-right mobile:ml-auto mobile:w-auto">
          <p className="font-body text-xs text-app-secondary">{formatResultsLabel(totalCount)}</p>
        </div>
      </div>

      {query.length > 0 ? (
        <p className="mt-m font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">
          Пошук: {query}
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-4 mobile:mt-10 mobile:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] mobile:gap-10">
        {books.map((book) => (
          <BookCard key={book.bookId} book={book} />
        ))}
      </div>

      {books.length > 0 && totalPages > 1 ? (
        <nav aria-label="Пагінація книг" className="mt-12 flex flex-wrap items-center gap-s">
          <Link
            href={buildPageHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`inline-flex h-[44px] items-center justify-center rounded-pill border px-5 font-body text-xs uppercase tracking-[0.12em] transition duration-fast ${
              page <= 1
                ? "pointer-events-none border-app-border-light text-app-muted"
                : "border-app-border-light text-app-primary hover:bg-white/[0.06]"
            }`}
          >
            Назад
          </Link>

          <div className="flex flex-wrap items-center gap-s">
            {visiblePages.map((pageNumber) => (
              <Link
                key={pageNumber}
                href={buildPageHref(pageNumber)}
                aria-current={pageNumber === page ? "page" : undefined}
                className={`inline-flex h-[40px] min-w-[40px] items-center justify-center rounded-full border px-3 font-body text-xs transition duration-fast ${
                  pageNumber === page
                    ? "border-app-white bg-white/[0.1] text-app-primary"
                    : "border-app-border-light text-app-secondary hover:bg-white/[0.06] hover:text-app-primary"
                }`}
              >
                {pageNumber}
              </Link>
            ))}
          </div>

          <Link
            href={buildPageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`inline-flex h-[44px] items-center justify-center rounded-pill border px-5 font-body text-xs uppercase tracking-[0.12em] transition duration-fast ${
              page >= totalPages
                ? "pointer-events-none border-app-border-light text-app-muted"
                : "border-app-border-light text-app-primary hover:bg-white/[0.06]"
            }`}
          >
            Далі
          </Link>

          <p className="ml-auto font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">
            Сторінка {page} з {totalPages}
          </p>
        </nav>
      ) : null}

      {books.length === 0 ? (
        <div className="mt-20 rounded-soft border border-app-border-light bg-app-card p-8 text-center">
          <p className="font-display text-2xl text-app-primary">Немає результатів</p>
          <p className="mt-2 font-body text-sm text-app-secondary">
            Спробуйте змінити параметри пошуку або скинути фільтри.
          </p>
        </div>
      ) : null}
    </section>
  );
}
