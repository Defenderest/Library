import { unstable_cache } from "next/cache";

import { formatUADate } from "@/lib/catalog/format";
import type {
  AuthorCardData,
  AuthorDetailsData,
  BookCardData,
  BookDetailsData,
  BooksCatalogFilters,
  SearchSuggestionData,
} from "@/lib/catalog/types";
import { queryFirst, queryRows } from "@/lib/db/raw";
import { prisma } from "@/lib/prisma";

type BookCardRow = {
  bookId: number;
  title: string;
  authors: string | null;
  price: number | string | null;
  coverImagePath: string | null;
  stockQuantity: number | null;
  genre: string | null;
};

type BookDetailsRow = BookCardRow & {
  description: string | null;
  language: string | null;
  publisherName: string | null;
  publicationDate: Date | string | null;
  isbn: string | null;
  pageCount: number | null;
};

type BookCommentRow = {
  commentText: string;
  commentDate: Date | string;
  rating: number | null;
  firstName: string;
  lastName: string;
};

type AuthorRow = {
  authorId: number;
  firstName: string;
  lastName: string;
  nationality: string | null;
  imagePath: string | null;
};

type AuthorDetailsRow = AuthorRow & {
  biography: string | null;
  birthDate: Date | string | null;
};

type SearchBookRow = {
  bookId: number;
  title: string;
  coverImagePath: string | null;
  price: number | string | null;
};

type SearchAuthorRow = {
  authorId: number;
  firstName: string;
  lastName: string;
  imagePath: string | null;
};

const HOME_REVALIDATE_SECONDS = 300;
const CATALOG_REVALIDATE_SECONDS = 600;
const DETAILS_REVALIDATE_SECONDS = 300;
const AUTHORS_REVALIDATE_SECONDS = 1800;
const SEARCH_REVALIDATE_SECONDS = 60;

function asNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

function asString(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function asOptionalText(value?: string): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function asOptionalNumber(value?: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

async function fetchHomeNewArrivals(limit: number): Promise<BookCardData[]> {
  const rows = await queryRows<BookCardRow>(prisma, "catalog/home_new_arrivals", [limit]);
  return rows.map(mapBookCard);
}

const getHomeNewArrivalsCached = unstable_cache(fetchHomeNewArrivals, ["catalog-home-new-arrivals"], {
  revalidate: HOME_REVALIDATE_SECONDS,
});

type BooksCatalogResult = {
  books: BookCardData[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  genres: string[];
  languages: string[];
};

function normalizeCatalogFilters(filters: BooksCatalogFilters) {
  return {
    query: asOptionalText(filters.query),
    genre: asOptionalText(filters.genre),
    language: asOptionalText(filters.language),
    minPrice: asOptionalNumber(filters.minPrice),
    maxPrice: asOptionalNumber(filters.maxPrice),
    inStockOnly: Boolean(filters.inStockOnly),
    page: Math.max(1, Math.floor(filters.page ?? 1)),
    pageSize: Math.min(Math.max(Math.floor(filters.pageSize ?? 12), 1), 36),
  };
}

async function fetchBooksCatalog(serializedFilters: string): Promise<BooksCatalogResult> {
  const filters = JSON.parse(serializedFilters) as ReturnType<typeof normalizeCatalogFilters>;
  const requestedPage = filters.page;
  const pageSize = filters.pageSize;

  const [countRow, genresRows, languagesRows] = await Promise.all([
    queryFirst<{ totalCount: number | null }>(prisma, "catalog/books_catalog_count", [
      filters.query,
      filters.genre,
      filters.language,
      filters.minPrice,
      filters.maxPrice,
      filters.inStockOnly,
    ]),
    queryRows<{ genre: string | null }>(prisma, "catalog/books_genres"),
    queryRows<{ language: string | null }>(prisma, "catalog/books_languages"),
  ]);

  const totalCount = Math.max(0, Math.floor(asNumber(countRow?.totalCount)));
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  const booksRows = await queryRows<BookCardRow>(prisma, "catalog/books_catalog", [
    filters.query,
    filters.genre,
    filters.language,
    filters.minPrice,
    filters.maxPrice,
    filters.inStockOnly,
    pageSize,
    offset,
  ]);

  return {
    books: booksRows.map(mapBookCard),
    totalCount,
    page,
    pageSize,
    totalPages,
    genres: genresRows
      .map((entry) => asString(entry.genre))
      .filter((value) => value.length > 0),
    languages: languagesRows
      .map((entry) => asString(entry.language))
      .filter((value) => value.length > 0),
  };
}

const getBooksCatalogCached = unstable_cache(fetchBooksCatalog, ["catalog-books"], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
});

async function fetchBookDetails(bookId: number): Promise<BookDetailsData | null> {
  const row = await queryFirst<BookDetailsRow>(prisma, "catalog/book_details", [bookId]);
  if (!row) {
    return null;
  }

  const commentsRows = await queryRows<BookCommentRow>(prisma, "catalog/book_comments", [bookId, 40]);
  const comments = commentsRows.map((comment) => ({
    authorName: `${comment.firstName} ${comment.lastName}`.trim() || "Читач",
    commentDate:
      comment.commentDate instanceof Date
        ? comment.commentDate.toISOString()
        : new Date(comment.commentDate).toISOString(),
    rating: Math.max(0, Math.floor(asNumber(comment.rating))),
    commentText: comment.commentText,
  }));

  const ratings = comments.map((comment) => comment.rating).filter((rating) => rating > 0);
  const averageRating =
    ratings.length > 0
      ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1))
      : 0;

  return {
    ...mapBookCard(row),
    description: asString(row.description) || "Опис відсутній",
    language: asString(row.language) || "-",
    publisherName: asString(row.publisherName) || "-",
    publicationDate: formatUADate(row.publicationDate),
    isbn: asString(row.isbn) || "-",
    pageCount: Math.max(0, Math.floor(asNumber(row.pageCount))),
    averageRating,
    comments,
  };
}

const getBookDetailsCached = unstable_cache(fetchBookDetails, ["catalog-book-details"], {
  revalidate: DETAILS_REVALIDATE_SECONDS,
});

async function fetchSimilarBooks(
  currentBookId: number,
  genre: string,
  limit: number,
): Promise<BookCardData[]> {
  const rows = await queryRows<BookCardRow>(prisma, "catalog/similar_books", [
    currentBookId,
    asOptionalText(genre),
    limit,
  ]);

  return rows.map(mapBookCard);
}

const getSimilarBooksCached = unstable_cache(fetchSimilarBooks, ["catalog-similar-books"], {
  revalidate: DETAILS_REVALIDATE_SECONDS,
});

async function fetchAuthorsList(): Promise<AuthorCardData[]> {
  const rows = await queryRows<AuthorRow>(prisma, "catalog/authors_list");

  return rows.map((author) => ({
    authorId: author.authorId,
    firstName: author.firstName,
    lastName: author.lastName,
    nationality: asString(author.nationality),
    imagePath: asString(author.imagePath),
  }));
}

const getAuthorsListCached = unstable_cache(fetchAuthorsList, ["catalog-authors-list"], {
  revalidate: AUTHORS_REVALIDATE_SECONDS,
});

async function fetchAuthorDetails(authorId: number): Promise<AuthorDetailsData | null> {
  const author = await queryFirst<AuthorDetailsRow>(prisma, "catalog/author_details", [authorId]);
  if (!author) {
    return null;
  }

  const booksRows = await queryRows<BookCardRow>(prisma, "catalog/author_books", [authorId]);

  return {
    authorId: author.authorId,
    firstName: author.firstName,
    lastName: author.lastName,
    fullName: `${author.firstName} ${author.lastName}`.trim(),
    nationality: asString(author.nationality),
    imagePath: asString(author.imagePath),
    biography: asString(author.biography) || "Біографія відсутня",
    birthDate: formatUADate(author.birthDate),
    books: booksRows.map(mapBookCard),
  };
}

const getAuthorDetailsCached = unstable_cache(fetchAuthorDetails, ["catalog-author-details"], {
  revalidate: AUTHORS_REVALIDATE_SECONDS,
});

async function fetchSearchSuggestions(query: string, limit: number): Promise<SearchSuggestionData[]> {
  const [booksRows, authorsRows] = await Promise.all([
    queryRows<SearchBookRow>(prisma, "catalog/search_books", [query, limit]),
    queryRows<SearchAuthorRow>(prisma, "catalog/search_authors", [query, limit]),
  ]);

  const suggestions: SearchSuggestionData[] = [
    ...booksRows.map((book) => ({
      id: book.bookId,
      type: "book" as const,
      displayText: book.title,
      imagePath: asString(book.coverImagePath),
      price: asNumber(book.price),
    })),
    ...authorsRows.map((author) => ({
      id: author.authorId,
      type: "author" as const,
      displayText: `${author.firstName} ${author.lastName}`.trim(),
      imagePath: asString(author.imagePath),
    })),
  ];

  const unique = new Map<string, SearchSuggestionData>();
  for (const suggestion of suggestions) {
    unique.set(`${suggestion.type}-${suggestion.id}`, suggestion);
    if (unique.size >= limit) {
      break;
    }
  }

  return Array.from(unique.values()).slice(0, limit);
}

const getSearchSuggestionsCached = unstable_cache(fetchSearchSuggestions, ["catalog-search-suggestions"], {
  revalidate: SEARCH_REVALIDATE_SECONDS,
});

function mapBookCard(row: BookCardRow): BookCardData {
  return {
    bookId: row.bookId,
    title: row.title,
    authors: asString(row.authors) || "Невідомий автор",
    price: asNumber(row.price),
    coverImagePath: asString(row.coverImagePath),
    stockQuantity: Math.max(0, Math.floor(asNumber(row.stockQuantity))),
    genre: asString(row.genre),
  };
}

export async function getHomeNewArrivals(limit = 6): Promise<BookCardData[]> {
  try {
    return await getHomeNewArrivalsCached(limit);
  } catch (error) {
    console.warn("Failed to load new arrivals from database:", error);
    return [];
  }
}

export async function getBooksCatalog(filters: BooksCatalogFilters) {
  const normalizedFilters = normalizeCatalogFilters(filters);

  try {
    return await getBooksCatalogCached(JSON.stringify(normalizedFilters));
  } catch (error) {
    console.warn("Failed to load books catalog from database:", error);
    return {
      books: [],
      totalCount: 0,
      page: 1,
      pageSize: normalizedFilters.pageSize,
      totalPages: 1,
      genres: [],
      languages: [],
    };
  }
}

export async function getBookDetails(bookId: number): Promise<BookDetailsData | null> {
  if (!Number.isFinite(bookId) || bookId <= 0) {
    return null;
  }

  try {
    return await getBookDetailsCached(bookId);
  } catch (error) {
    console.warn("Failed to load book details from database:", error);
    return null;
  }
}

export async function getSimilarBooks(
  currentBookId: number,
  genre: string,
  limit = 5,
): Promise<BookCardData[]> {
  try {
    return await getSimilarBooksCached(currentBookId, genre, limit);
  } catch (error) {
    console.warn("Failed to load similar books from database:", error);
    return [];
  }
}

export async function getAuthorsList(): Promise<AuthorCardData[]> {
  try {
    return await getAuthorsListCached();
  } catch (error) {
    console.warn("Failed to load authors from database:", error);
    return [];
  }
}

export async function getAuthorDetails(authorId: number): Promise<AuthorDetailsData | null> {
  if (!Number.isFinite(authorId) || authorId <= 0) {
    return null;
  }

  try {
    return await getAuthorDetailsCached(authorId);
  } catch (error) {
    console.warn("Failed to load author details from database:", error);
    return null;
  }
}

export async function getSearchSuggestions(
  query: string,
  limit = 8,
): Promise<SearchSuggestionData[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    return [];
  }

  try {
    return await getSearchSuggestionsCached(trimmedQuery, limit);
  } catch (error) {
    console.warn("Failed to load search suggestions from database:", error);
    return [];
  }
}
