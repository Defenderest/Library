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

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const query = readSearchParam(searchParams?.q).trim();
  const genre = readSearchParam(searchParams?.genre).trim();
  const language = readSearchParam(searchParams?.language).trim();
  const minPriceText = readSearchParam(searchParams?.minPrice).trim();
  const maxPriceText = readSearchParam(searchParams?.maxPrice).trim();
  const inStockOnly = readSearchParam(searchParams?.inStock) === "1";

  const { books, genres, languages } = await getBooksCatalog({
    query,
    genre,
    language,
    minPrice: parseNonNegativeNumber(minPriceText),
    maxPrice: parseNonNegativeNumber(maxPriceText),
    inStockOnly,
  });

  return (
    <section className="relative">
      <div className="flex items-center gap-m">
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

        <div className="ml-auto">
          <p className="font-body text-xs text-app-secondary">{formatResultsLabel(books.length)}</p>
        </div>
      </div>

      {query.length > 0 ? (
        <p className="mt-m font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">
          Пошук: {query}
        </p>
      ) : null}

      <div className="mt-10 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-10">
        {books.map((book) => (
          <BookCard key={book.bookId} book={book} />
        ))}
      </div>

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
