import {
  getAuthorDetails,
  getBookDetails,
  getBooksCatalog,
  getSimilarBooks,
} from "@/lib/catalog/queries";
import type { BookCardData, BookDetailsData, BooksCatalogFilters } from "@/lib/catalog/types";
import { queryRows } from "@/lib/db/raw";
import { prisma } from "@/lib/prisma";

type ToolArguments = Record<string, unknown>;

type SearchAuthorRow = {
  authorId: number;
  firstName: string;
  lastName: string;
  imagePath: string | null;
};

type ToolBook = {
  bookId: number;
  title: string;
  authors: string;
  genre: string;
  price: number;
  stockQuantity: number;
  language?: string;
  pageCount?: number;
  descriptionPreview?: string;
  href: string;
  source: "catalog";
  score?: number;
  matchReasons?: string[];
};

type RecommendationProfile = {
  request: string;
  query: string;
  genre: string | null;
  language: string | null;
  maxPrice: number | null;
  maxPages: number | null;
  inStockOnly: boolean;
  nonFiction: boolean;
  shortBook: boolean;
  gift: boolean;
  evening: boolean;
  atmospheric: boolean;
  dark: boolean;
  referenceTitle: string | null;
  preferredKeywords: string[];
};

export type AiToolName =
  | "recommend_books"
  | "search_books"
  | "get_book_details"
  | "search_authors"
  | "get_author_books"
  | "get_books_by_genre"
  | "get_books_under_price"
  | "get_books_in_stock"
  | "get_similar_books";

type AiToolDeclaration = {
  name: AiToolName;
  description: string;
  parameters: {
    type: "OBJECT";
    properties: Record<string, unknown>;
    required?: string[];
  };
};

const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 8;
const NON_FICTION_GENRE = "Науково-популярне";

export const AI_TOOL_DECLARATIONS: AiToolDeclaration[] = [
  {
    name: "recommend_books",
    description: "Recommend real books from the catalog by mood, genre, budget, occasion, length, language, or similarity.",
    parameters: {
      type: "OBJECT",
      required: ["request"],
      properties: {
        request: {
          type: "STRING",
          description: "Original user request for book recommendations.",
        },
        limit: {
          type: "INTEGER",
          description: "Max recommendations, default 4, max 6.",
        },
      },
    },
  },
  {
    name: "search_books",
    description: "Search books by title or author with optional genre, language, budget, and stock filters.",
    parameters: {
      type: "OBJECT",
      required: ["query"],
      properties: {
        query: { type: "STRING", description: "Book title or author query." },
        genre: { type: "STRING", description: "Optional genre filter." },
        language: { type: "STRING", description: "Optional language filter." },
        maxPrice: { type: "NUMBER", description: "Optional maximum price in UAH." },
        inStockOnly: { type: "BOOLEAN", description: "Return only books in stock." },
        limit: { type: "INTEGER", description: "Max results, default 5, max 8." },
      },
    },
  },
  {
    name: "get_book_details",
    description: "Get detailed catalog data for one specific book.",
    parameters: {
      type: "OBJECT",
      properties: {
        bookId: { type: "INTEGER", description: "Book identifier if known." },
        query: { type: "STRING", description: "Book title query if id is unknown." },
      },
    },
  },
  {
    name: "search_authors",
    description: "Search authors by first or last name.",
    parameters: {
      type: "OBJECT",
      required: ["query"],
      properties: {
        query: { type: "STRING", description: "Author search query." },
        limit: { type: "INTEGER", description: "Max results, default 5, max 8." },
      },
    },
  },
  {
    name: "get_author_books",
    description: "Get one author profile and their books.",
    parameters: {
      type: "OBJECT",
      properties: {
        authorId: { type: "INTEGER", description: "Author identifier if known." },
        query: { type: "STRING", description: "Author name query if id is unknown." },
      },
    },
  },
  {
    name: "get_books_by_genre",
    description: "Get books from a specific genre with optional language, stock, and price filters.",
    parameters: {
      type: "OBJECT",
      required: ["genre"],
      properties: {
        genre: { type: "STRING", description: "Genre name." },
        language: { type: "STRING", description: "Optional language filter." },
        maxPrice: { type: "NUMBER", description: "Optional maximum price in UAH." },
        inStockOnly: { type: "BOOLEAN", description: "Return only books in stock." },
        limit: { type: "INTEGER", description: "Max results, default 5, max 8." },
      },
    },
  },
  {
    name: "get_books_under_price",
    description: "Get books under a specific price, optionally filtered by genre, language, and search phrase.",
    parameters: {
      type: "OBJECT",
      required: ["maxPrice"],
      properties: {
        maxPrice: { type: "NUMBER", description: "Maximum price in UAH." },
        genre: { type: "STRING", description: "Optional genre filter." },
        language: { type: "STRING", description: "Optional language filter." },
        query: { type: "STRING", description: "Optional title or author query." },
        inStockOnly: { type: "BOOLEAN", description: "Return only books in stock." },
        limit: { type: "INTEGER", description: "Max results, default 5, max 8." },
      },
    },
  },
  {
    name: "get_books_in_stock",
    description: "Get books currently available in stock, optionally filtered by genre, language, price, or query.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Optional title or author query." },
        genre: { type: "STRING", description: "Optional genre filter." },
        language: { type: "STRING", description: "Optional language filter." },
        maxPrice: { type: "NUMBER", description: "Optional maximum price in UAH." },
        limit: { type: "INTEGER", description: "Max results, default 5, max 8." },
      },
    },
  },
  {
    name: "get_similar_books",
    description: "Find similar books based on a known book from the catalog.",
    parameters: {
      type: "OBJECT",
      properties: {
        bookId: { type: "INTEGER", description: "Reference book id if known." },
        query: { type: "STRING", description: "Reference book title if id is unknown." },
        inStockOnly: { type: "BOOLEAN", description: "Return only books in stock." },
        limit: { type: "INTEGER", description: "Max results, default 5, max 8." },
      },
    },
  },
];

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function asPositiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return fallback;
}

function clampLimit(value: unknown, fallback = DEFAULT_LIMIT): number {
  const parsed = asPositiveInt(value);
  if (!parsed) {
    return fallback;
  }

  return Math.min(parsed, MAX_LIMIT);
}

function truncateText(value: string, limit = 160): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 1).trimEnd()}…`;
}

function mapToolBook(book: BookCardData | BookDetailsData, matchReasons?: string[]): ToolBook {
  const details = "language" in book ? book : null;

  return {
    bookId: book.bookId,
    title: book.title,
    authors: book.authors,
    genre: book.genre,
    price: Number(book.price.toFixed(2)),
    stockQuantity: book.stockQuantity,
    language: details?.language,
    pageCount: details?.pageCount,
    descriptionPreview: details?.description ? truncateText(details.description) : undefined,
    href: `/books/${book.bookId}`,
    source: "catalog",
    matchReasons: matchReasons && matchReasons.length > 0 ? Array.from(new Set(matchReasons)).slice(0, 3) : undefined,
  };
}

function dedupeBooks<T extends { bookId: number }>(books: T[]): T[] {
  const unique = new Map<number, T>();

  for (const book of books) {
    if (!unique.has(book.bookId)) {
      unique.set(book.bookId, book);
    }
  }

  return Array.from(unique.values());
}

async function getCatalogBooks(filters: BooksCatalogFilters): Promise<BookCardData[]> {
  const result = await getBooksCatalog({
    page: 1,
    pageSize: filters.pageSize ?? 12,
    query: filters.query,
    genre: filters.genre,
    language: filters.language,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStockOnly: filters.inStockOnly,
  });

  return result.books;
}

async function getDetailedBooks(books: BookCardData[], maxCount = 10): Promise<BookDetailsData[]> {
  const uniqueBooks = dedupeBooks(books).slice(0, maxCount);
  const details = await Promise.all(uniqueBooks.map((book) => getBookDetails(book.bookId)));
  return details.filter((detail): detail is BookDetailsData => Boolean(detail));
}

function containsAny(text: string, fragments: string[]): boolean {
  return fragments.some((fragment) => text.includes(fragment));
}

function inferBudget(text: string): number | null {
  const match = text.match(/(?:до|не\s+дорожче|не\s+більше|бюджет)\s*(\d{2,5})/i)
    ?? text.match(/(\d{2,5})\s*грн/i);

  if (!match) {
    return null;
  }

  return asPositiveNumber(match[1]);
}

function inferReferenceTitle(rawRequest: string): string | null {
  const request = rawRequest.trim();
  const lower = request.toLocaleLowerCase("uk-UA");

  if (lower.includes("гаррі поттер")) {
    return "Гаррі Поттер";
  }

  const similarMatch = request.match(/(?:схоже на|щось як|як книга|як серія)\s+(.+)/i);
  if (!similarMatch) {
    return null;
  }

  return similarMatch[1]?.trim() || null;
}

function inferGenre(text: string): string | null {
  if (containsAny(text, ["фентез"])) {
    return "Фентезі";
  }

  if (containsAny(text, ["науков", "sci-fi", "sci fi", "фантаст"])) {
    return containsAny(text, ["фантаст"]) ? "Наукова фантастика" : null;
  }

  if (containsAny(text, ["класик"])) {
    return "Класика";
  }

  if (containsAny(text, ["нон-фікш", "нонфікш", "не худож", "серйозн", "non-fiction", "non fiction"])) {
    return NON_FICTION_GENRE;
  }

  if (containsAny(text, ["сучасн", "проза"])) {
    return "Сучасна проза";
  }

  return null;
}

function inferLanguage(text: string): string | null {
  if (containsAny(text, ["україн"])) {
    return "українська";
  }

  if (containsAny(text, ["англій", "english"])) {
    return "англійська";
  }

  return null;
}

function buildPreferredKeywords(text: string, genre: string | null, referenceTitle: string | null): string[] {
  const keywords: string[] = [];

  if (containsAny(text, ["темн", "похм", "готич", "dark"])) {
    keywords.push("тем", "похм", "готич", "ніч", "тін", "морок");
  }

  if (containsAny(text, ["атмосфер", "вечір", "тих", "затиш", "медит"])) {
    keywords.push("атмосфер", "тих", "затиш", "веч", "осін", "міст");
  }

  if (containsAny(text, ["подар", "подарунк"])) {
    keywords.push("культ", "відом", "бестселер", "роман", "подорож");
  }

  if (containsAny(text, ["не худож", "нон-фікш", "нонфікш", "серйозн"])) {
    keywords.push("істор", "наук", "філософ", "психолог", "суспіль", "есе");
  }

  if (containsAny(text, ["коротк", "невел", "швидк"])) {
    keywords.push("оповід", "есе", "новел", "корот");
  }

  if (genre === "Фентезі" || referenceTitle) {
    keywords.push("магі", "пригод", "дружб", "школ", "легенд", "світ");
  }

  if (genre === "Наукова фантастика") {
    keywords.push("косм", "майбут", "технолог", "наук");
  }

  return Array.from(new Set(keywords));
}

function buildRecommendationProfile(args: ToolArguments): RecommendationProfile {
  const request = asText(args.request || args.query);
  const normalized = request.toLocaleLowerCase("uk-UA");
  const inferredGenre = inferGenre(normalized);
  const inferredLanguage = inferLanguage(normalized);
  const inferredBudget = inferBudget(normalized);
  const referenceTitle = asText(args.referenceTitle) || inferReferenceTitle(request);
  const shortBook = containsAny(normalized, ["коротк", "невел", "швидк"]);
  const evening = containsAny(normalized, ["вечір", "на ніч", "перед сном"]);
  const atmospheric = containsAny(normalized, ["атмосфер", "тих", "затиш", "медит"]);
  const dark = containsAny(normalized, ["темн", "похм", "готич", "dark"]);
  const gift = containsAny(normalized, ["подар", "подарунк"]);
  const nonFiction =
    containsAny(normalized, ["не худож", "нон-фікш", "нонфікш", "серйозн", "non-fiction", "non fiction"])
    || inferredGenre === NON_FICTION_GENRE;
  const explicitGenre = asText(args.genre);
  const explicitLanguage = asText(args.language);
  const genre = explicitGenre || inferredGenre;
  const language = explicitLanguage || inferredLanguage;
  const maxPrice = asPositiveNumber(args.maxPrice) ?? inferredBudget;
  const maxPages = asPositiveInt(args.maxPages) ?? (shortBook ? 320 : evening ? 380 : null);

  const hasStructuredIntent =
    Boolean(genre)
    || Boolean(language)
    || Boolean(maxPrice)
    || Boolean(referenceTitle)
    || shortBook
    || evening
    || atmospheric
    || dark
    || gift
    || nonFiction;

  return {
    request,
    query: hasStructuredIntent ? "" : request,
    genre: genre || null,
    language: language || null,
    maxPrice,
    maxPages,
    inStockOnly: args.inStockOnly === undefined ? true : asBoolean(args.inStockOnly, true),
    nonFiction,
    shortBook,
    gift,
    evening,
    atmospheric,
    dark,
    referenceTitle: referenceTitle || null,
    preferredKeywords: buildPreferredKeywords(normalized, genre || null, referenceTitle || null),
  };
}

function scoreBook(
  details: BookDetailsData,
  profile: RecommendationProfile,
  referenceBook: BookDetailsData | null,
): { score: number; reasons: string[] } {
  const haystack = `${details.title} ${details.authors} ${details.genre} ${details.language} ${details.description}`
    .toLocaleLowerCase("uk-UA");
  const reasons: string[] = [];
  let score = details.stockQuantity > 0 ? 40 : profile.inStockOnly ? -20 : 0;

  if (details.stockQuantity > 0) {
    reasons.push("є в наявності");
  }

  if (profile.genre && details.genre.toLocaleLowerCase("uk-UA") === profile.genre.toLocaleLowerCase("uk-UA")) {
    score += 18;
    reasons.push(profile.genre);
  }

  if (
    profile.language
    && details.language.toLocaleLowerCase("uk-UA").includes(profile.language.toLocaleLowerCase("uk-UA"))
  ) {
    score += 16;
    reasons.push(profile.language);
  }

  if (profile.maxPrice !== null) {
    if (details.price <= profile.maxPrice) {
      score += 16;
      reasons.push(`до ${Math.round(profile.maxPrice)} грн`);
    } else {
      score -= Math.min(16, Math.ceil((details.price - profile.maxPrice) / 50) * 2);
    }
  }

  if (profile.maxPages !== null && details.pageCount > 0) {
    if (details.pageCount <= profile.maxPages) {
      score += 10;
      reasons.push(`≈ ${details.pageCount} стор.`);
    } else {
      score -= 6;
    }
  }

  if (profile.nonFiction) {
    if (details.genre.toLocaleLowerCase("uk-UA") === NON_FICTION_GENRE.toLocaleLowerCase("uk-UA")) {
      score += 14;
      reasons.push("не художня");
    } else {
      score -= 10;
    }
  }

  if (profile.gift) {
    if (details.stockQuantity > 0) {
      score += 6;
    }
    if (details.price >= 180 && details.price <= 900) {
      score += 6;
      reasons.push("під подарунок");
    }
    if (details.pageCount >= 160 && details.pageCount <= 480) {
      score += 4;
    }
  }

  if (profile.evening) {
    if (details.pageCount > 0 && details.pageCount <= 380) {
      score += 5;
    }
    reasons.push("для вечірнього читання");
  }

  if (profile.atmospheric) {
    reasons.push("атмосферна");
  }

  if (profile.dark) {
    reasons.push("похмурий тон");
  }

  const keywordMatches = profile.preferredKeywords.filter((keyword) => haystack.includes(keyword));
  score += Math.min(keywordMatches.length * 4, 16);

  if (referenceBook && details.bookId !== referenceBook.bookId) {
    if (details.genre === referenceBook.genre) {
      score += 10;
      reasons.push(`схожа за жанром на ${referenceBook.title}`);
    }

    const sharedAuthor = referenceBook.authors
      .split(",")
      .map((author) => author.trim())
      .find((author) => author.length > 0 && details.authors.includes(author));

    if (sharedAuthor) {
      score += 8;
      reasons.push(`той самий автор: ${sharedAuthor}`);
    }
  }

  if (profile.shortBook && details.pageCount > 0 && details.pageCount <= 320) {
    reasons.push("коротка");
  }

  return {
    score,
    reasons: Array.from(new Set(reasons)).slice(0, 3),
  };
}

async function resolveReferenceBook(referenceTitle: string | null): Promise<BookDetailsData | null> {
  if (!referenceTitle || referenceTitle.length < 2) {
    return null;
  }

  const books = await getCatalogBooks({
    query: referenceTitle,
    pageSize: 3,
    inStockOnly: false,
  });

  const firstBook = books[0];
  if (!firstBook) {
    return null;
  }

  return getBookDetails(firstBook.bookId);
}

async function collectRecommendationCandidates(
  profile: RecommendationProfile,
  limit: number,
): Promise<{ books: BookCardData[]; referenceBook: BookDetailsData | null; fallbackUsed: boolean }> {
  const candidates: BookCardData[] = [];
  const requestPageSize = Math.min(Math.max(limit * 4, 12), 24);
  let fallbackUsed = false;
  const referenceBook = await resolveReferenceBook(profile.referenceTitle);

  if (referenceBook) {
    const similarBooks = await getSimilarBooks(referenceBook.bookId, referenceBook.genre, requestPageSize);
    candidates.push(...similarBooks.filter((book) => book.bookId !== referenceBook.bookId));

    if (candidates.length < requestPageSize && referenceBook.genre) {
      candidates.push(
        ...(await getCatalogBooks({
          genre: referenceBook.genre,
          language: profile.language ?? undefined,
          maxPrice: profile.maxPrice ?? undefined,
          inStockOnly: profile.inStockOnly,
          pageSize: requestPageSize,
        })),
      );
    }
  }

  candidates.push(
    ...(await getCatalogBooks({
      query: profile.query || undefined,
      genre: profile.genre ?? undefined,
      language: profile.language ?? undefined,
      maxPrice: profile.maxPrice ?? undefined,
      inStockOnly: profile.inStockOnly,
      pageSize: requestPageSize,
    })),
  );

  if (profile.nonFiction) {
    candidates.push(
      ...(await getCatalogBooks({
        genre: NON_FICTION_GENRE,
        language: profile.language ?? undefined,
        maxPrice: profile.maxPrice ?? undefined,
        inStockOnly: profile.inStockOnly,
        pageSize: requestPageSize,
      })),
    );
  }

  let uniqueCandidates = dedupeBooks(candidates);

  if (uniqueCandidates.length === 0) {
    fallbackUsed = true;
    uniqueCandidates = dedupeBooks([
      ...(await getCatalogBooks({
        genre: profile.genre ?? undefined,
        language: profile.language ?? undefined,
        maxPrice: profile.maxPrice ?? undefined,
        inStockOnly: false,
        pageSize: requestPageSize,
      })),
      ...(await getCatalogBooks({
        language: profile.language ?? undefined,
        maxPrice: profile.maxPrice ?? undefined,
        inStockOnly: true,
        pageSize: requestPageSize,
      })),
    ]);
  }

  return {
    books: uniqueCandidates.slice(0, requestPageSize),
    referenceBook,
    fallbackUsed,
  };
}

async function runRecommendBooks(args: ToolArguments) {
  const profile = buildRecommendationProfile(args);
  const limit = Math.min(clampLimit(args.limit, DEFAULT_LIMIT), 6);

  if (profile.request.length < 2) {
    return {
      found: false,
      message: "Опишіть, який настрій, жанр або бюджет вас цікавить.",
      books: [],
    };
  }

  const { books, referenceBook, fallbackUsed } = await collectRecommendationCandidates(profile, limit);
  const detailedBooks = await getDetailedBooks(books, Math.min(books.length, 12));

  const ranked = detailedBooks
    .map((details) => ({
      details,
      ...scoreBook(details, profile, referenceBook),
    }))
    .filter((entry) => (profile.inStockOnly ? entry.details.stockQuantity > 0 : true))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  const recommendationBooks = ranked.map((entry) => mapToolBook(entry.details, entry.reasons));
  recommendationBooks.forEach((book, index) => {
    book.score = Number(ranked[index]?.score?.toFixed(2) ?? 0);
  });

  return {
    found: recommendationBooks.length > 0,
    fallbackUsed: fallbackUsed || recommendationBooks.length === 0,
    message:
      recommendationBooks.length > 0
        ? fallbackUsed
          ? "Точного збігу не знайшов, але підібрав найближчі реальні альтернативи з каталогу."
          : "Підібрав реальні книги з каталогу під цей запит."
        : "Не знайшов точного збігу в каталозі."
    ,
    appliedFilters: {
      genre: profile.genre,
      language: profile.language,
      maxPrice: profile.maxPrice,
      maxPages: profile.maxPages,
      inStockOnly: profile.inStockOnly,
      referenceTitle: profile.referenceTitle,
    },
    referenceBook: referenceBook ? mapToolBook(referenceBook) : null,
    books: recommendationBooks,
  };
}

function createCatalogResponse(books: BookCardData[], note: string) {
  return {
    found: books.length > 0,
    message: note,
    books: books.map((book) => mapToolBook(book)),
  };
}

async function runSearchBooks(args: ToolArguments) {
  const query = asText(args.query);
  if (query.length < 2) {
    return {
      found: false,
      message: "Пошуковий запит має містити щонайменше 2 символи.",
      books: [],
    };
  }

  const limit = clampLimit(args.limit, 5);
  const books = await getCatalogBooks({
    query,
    genre: asText(args.genre) || undefined,
    language: asText(args.language) || undefined,
    maxPrice: asPositiveNumber(args.maxPrice) ?? undefined,
    inStockOnly: args.inStockOnly === undefined ? false : asBoolean(args.inStockOnly),
    pageSize: limit,
  });

  return createCatalogResponse(books, "Результати пошуку за каталогом.");
}

async function runGetBookDetails(args: ToolArguments) {
  const bookId = asPositiveInt(args.bookId);
  const query = asText(args.query);

  let details = bookId ? await getBookDetails(bookId) : null;

  if (!details && query.length >= 2) {
    const books = await getCatalogBooks({ query, pageSize: 1, inStockOnly: false });
    const firstBook = books[0];
    if (firstBook) {
      details = await getBookDetails(firstBook.bookId);
    }
  }

  if (!details) {
    return {
      found: false,
      message: "Книгу не знайдено.",
    };
  }

  return {
    found: true,
    book: mapToolBook(details),
    fullBook: {
      ...mapToolBook(details),
      publicationDate: details.publicationDate,
      isbn: details.isbn,
      averageRating: details.averageRating,
      commentsCount: details.comments.length,
      description: details.description,
    },
  };
}

async function runSearchAuthors(args: ToolArguments) {
  const query = asText(args.query);
  if (query.length < 2) {
    return {
      found: false,
      message: "Пошуковий запит має містити щонайменше 2 символи.",
      authors: [],
    };
  }

  const limit = clampLimit(args.limit, 5);
  const rows = await queryRows<SearchAuthorRow>(prisma, "catalog/search_authors", [query, limit]);

  return {
    found: rows.length > 0,
    authors: rows.map((author) => ({
      authorId: author.authorId,
      fullName: `${author.firstName} ${author.lastName}`.trim(),
      href: `/authors/${author.authorId}`,
    })),
  };
}

async function runGetAuthorBooks(args: ToolArguments) {
  const authorId = asPositiveInt(args.authorId);
  const query = asText(args.query);

  let resolvedAuthorId = authorId;

  if (!resolvedAuthorId && query.length >= 2) {
    const rows = await queryRows<SearchAuthorRow>(prisma, "catalog/search_authors", [query, 1]);
    resolvedAuthorId = rows[0]?.authorId ?? null;
  }

  if (!resolvedAuthorId) {
    return {
      found: false,
      message: "Автора не знайдено.",
    };
  }

  const details = await getAuthorDetails(resolvedAuthorId);
  if (!details) {
    return {
      found: false,
      message: "Автора не знайдено.",
    };
  }

  return {
    found: true,
    author: {
      authorId: details.authorId,
      fullName: details.fullName,
      nationality: details.nationality,
      birthDate: details.birthDate,
      biography: details.biography,
      href: `/authors/${details.authorId}`,
      books: details.books.map((book) => mapToolBook(book)),
    },
  };
}

async function runGetBooksByGenre(args: ToolArguments) {
  const genre = asText(args.genre);
  if (genre.length === 0) {
    return {
      found: false,
      message: "Вкажіть жанр для підбірки.",
      books: [],
    };
  }

  const limit = clampLimit(args.limit, 5);
  const books = await getCatalogBooks({
    genre,
    language: asText(args.language) || undefined,
    maxPrice: asPositiveNumber(args.maxPrice) ?? undefined,
    inStockOnly: args.inStockOnly === undefined ? true : asBoolean(args.inStockOnly, true),
    pageSize: limit,
  });

  return createCatalogResponse(books, `Підібрав книги жанру ${genre}.`);
}

async function runGetBooksUnderPrice(args: ToolArguments) {
  const maxPrice = asPositiveNumber(args.maxPrice);
  if (maxPrice === null) {
    return {
      found: false,
      message: "Вкажіть максимальну ціну у гривнях.",
      books: [],
    };
  }

  const limit = clampLimit(args.limit, 5);
  const books = await getCatalogBooks({
    query: asText(args.query) || undefined,
    genre: asText(args.genre) || undefined,
    language: asText(args.language) || undefined,
    maxPrice,
    inStockOnly: args.inStockOnly === undefined ? true : asBoolean(args.inStockOnly, true),
    pageSize: limit,
  });

  return createCatalogResponse(books, `Підібрав книги до ${Math.round(maxPrice)} грн.`);
}

async function runGetBooksInStock(args: ToolArguments) {
  const limit = clampLimit(args.limit, 5);
  const books = await getCatalogBooks({
    query: asText(args.query) || undefined,
    genre: asText(args.genre) || undefined,
    language: asText(args.language) || undefined,
    maxPrice: asPositiveNumber(args.maxPrice) ?? undefined,
    inStockOnly: true,
    pageSize: limit,
  });

  return createCatalogResponse(books, "Підібрав книги, які зараз є в наявності.");
}

async function runGetSimilarBooks(args: ToolArguments) {
  const limit = clampLimit(args.limit, 5);
  const inStockOnly = args.inStockOnly === undefined ? true : asBoolean(args.inStockOnly, true);
  const bookId = asPositiveInt(args.bookId);
  const query = asText(args.query);

  let referenceBook = bookId ? await getBookDetails(bookId) : null;

  if (!referenceBook && query.length >= 2) {
    referenceBook = await resolveReferenceBook(query);
  }

  if (!referenceBook) {
    return {
      found: false,
      message: "Не вдалося знайти книгу, від якої можна відштовхнутися для схожих рекомендацій.",
      books: [],
    };
  }

  const books = (await getSimilarBooks(referenceBook.bookId, referenceBook.genre, limit * 2)).filter(
    (book) => book.bookId !== referenceBook.bookId && (!inStockOnly || book.stockQuantity > 0),
  );

  return {
    found: books.length > 0,
    referenceBook: mapToolBook(referenceBook),
    books: books.slice(0, limit).map((book) => mapToolBook(book)),
    message: `Знайшов схожі книги до ${referenceBook.title}.`,
  };
}

export async function runAiTool(
  name: string,
  args: ToolArguments,
): Promise<Record<string, unknown>> {
  switch (name) {
    case "recommend_books":
      return runRecommendBooks(args);
    case "search_books":
      return runSearchBooks(args);
    case "get_book_details":
      return runGetBookDetails(args);
    case "search_authors":
      return runSearchAuthors(args);
    case "get_author_books":
      return runGetAuthorBooks(args);
    case "get_books_by_genre":
      return runGetBooksByGenre(args);
    case "get_books_under_price":
      return runGetBooksUnderPrice(args);
    case "get_books_in_stock":
      return runGetBooksInStock(args);
    case "get_similar_books":
      return runGetSimilarBooks(args);
    default:
      return {
        found: false,
        message: `Unknown tool: ${name}`,
      };
  }
}
