import { Prisma } from "@prisma/client";

import {
  FALLBACK_AUTHOR_DETAILS,
  FALLBACK_AUTHORS,
  FALLBACK_BOOK_DETAILS,
  FALLBACK_BOOKS,
  FALLBACK_NEW_ARRIVAL_IDS,
  FALLBACK_SEARCH_SUGGESTIONS,
} from "@/lib/catalog/fallback-data";
import { formatUADate } from "@/lib/catalog/format";
import type {
  AuthorCardData,
  AuthorDetailsData,
  BookCardData,
  BookDetailsData,
  BooksCatalogFilters,
  SearchSuggestionData,
} from "@/lib/catalog/types";
import { prisma } from "@/lib/prisma";

type PrismaBookWithAuthors = {
  bookId: number;
  title: string;
  price: Prisma.Decimal | null;
  coverImagePath: string | null;
  stockQuantity: number;
  genre: string | null;
  language: string | null;
  publicationDate: Date | null;
  authors: Array<{
    author: {
      firstName: string;
      lastName: string;
    };
  }>;
};

type PrismaCommentWithCustomer = {
  commentText: string;
  commentDate: Date;
  rating: number | null;
  customer: {
    firstName: string;
    lastName: string;
  };
};

const DATABASE_CONFIGURED = Boolean(process.env.DATABASE_URL);

function compareUa(a: string, b: string): number {
  return a.localeCompare(b, "uk", { sensitivity: "base" });
}

function normalizeText(value?: string): string {
  return value?.trim() ?? "";
}

function containsNormalized(text: string, query: string): boolean {
  return normalizeText(text).toLowerCase().includes(normalizeText(query).toLowerCase());
}

function mapAuthors(
  authors: Array<{
    author: {
      firstName: string;
      lastName: string;
    };
  }>,
): string {
  const names = authors
    .map(({ author }) => `${author.firstName} ${author.lastName}`.trim())
    .filter((value) => value.length > 0);

  return names.length > 0 ? names.join(", ") : "Невідомий автор";
}

function mapPrismaBookToCard(book: PrismaBookWithAuthors): BookCardData {
  return {
    bookId: book.bookId,
    title: book.title,
    authors: mapAuthors(book.authors),
    price: Number(book.price ?? 0),
    coverImagePath: book.coverImagePath ?? "",
    stockQuantity: book.stockQuantity,
    genre: book.genre ?? "",
  };
}

function mapPrismaComment(comment: PrismaCommentWithCustomer) {
  return {
    authorName: `${comment.customer.firstName} ${comment.customer.lastName}`.trim() || "Читач",
    commentDate: comment.commentDate.toISOString(),
    rating: comment.rating ?? 0,
    commentText: comment.commentText,
  };
}

function getFallbackLanguages(): string[] {
  const languageSet = new Set(
    Object.values(FALLBACK_BOOK_DETAILS)
      .map((book) => book.language)
      .filter((value) => value.length > 0),
  );

  return Array.from(languageSet).sort(compareUa);
}

function getFallbackGenres(): string[] {
  const genreSet = new Set(
    FALLBACK_BOOKS.map((book) => book.genre).filter((value) => value.length > 0),
  );

  return Array.from(genreSet).sort(compareUa);
}

function filterFallbackBooks(filters: BooksCatalogFilters): BookCardData[] {
  return FALLBACK_BOOKS.filter((book) => {
    if (filters.query) {
      const searchable = `${book.title} ${book.authors}`;
      if (!containsNormalized(searchable, filters.query)) {
        return false;
      }
    }

    if (filters.genre && book.genre !== filters.genre) {
      return false;
    }

    const details = FALLBACK_BOOK_DETAILS[book.bookId];
    if (filters.language && details?.language !== filters.language) {
      return false;
    }

    if (typeof filters.minPrice === "number" && book.price < filters.minPrice) {
      return false;
    }

    if (typeof filters.maxPrice === "number" && book.price > filters.maxPrice) {
      return false;
    }

    if (filters.inStockOnly && book.stockQuantity <= 0) {
      return false;
    }

    return true;
  }).sort((a, b) => compareUa(a.title, b.title));
}

function getFallbackBookDetails(bookId: number): BookDetailsData | null {
  return FALLBACK_BOOK_DETAILS[bookId] ?? null;
}

function getFallbackSimilarBooks(bookId: number, genre: string, limit: number): BookCardData[] {
  const sameGenre = FALLBACK_BOOKS.filter((book) => book.bookId !== bookId && book.genre === genre);
  if (sameGenre.length >= limit) {
    return sameGenre.slice(0, limit);
  }

  const rest = FALLBACK_BOOKS.filter(
    (book) => book.bookId !== bookId && !sameGenre.some((match) => match.bookId === book.bookId),
  );

  return [...sameGenre, ...rest].slice(0, limit);
}

function getFallbackAuthorDetails(authorId: number): AuthorDetailsData | null {
  return FALLBACK_AUTHOR_DETAILS[authorId] ?? null;
}

function getFallbackSearchSuggestions(query: string, limit: number): SearchSuggestionData[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) {
    return [];
  }

  return FALLBACK_SEARCH_SUGGESTIONS.filter((item) => item.displayText.toLowerCase().includes(normalized)).slice(
    0,
    limit,
  );
}

function createBooksWhereInput(filters: BooksCatalogFilters): Prisma.BookWhereInput {
  const clauses: Prisma.BookWhereInput[] = [];

  if (filters.query) {
    clauses.push({
      OR: [
        { title: { contains: filters.query, mode: "insensitive" } },
        {
          authors: {
            some: {
              author: {
                OR: [
                  { firstName: { contains: filters.query, mode: "insensitive" } },
                  { lastName: { contains: filters.query, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      ],
    });
  }

  if (filters.genre) {
    clauses.push({ genre: filters.genre });
  }

  if (filters.language) {
    clauses.push({ language: filters.language });
  }

  if (typeof filters.minPrice === "number" || typeof filters.maxPrice === "number") {
    clauses.push({
      price: {
        gte: filters.minPrice,
        lte: filters.maxPrice,
      },
    });
  }

  if (filters.inStockOnly) {
    clauses.push({ stockQuantity: { gt: 0 } });
  }

  if (clauses.length === 0) {
    return {};
  }

  return { AND: clauses };
}

export async function getHomeNewArrivals(limit = 6): Promise<BookCardData[]> {
  if (!DATABASE_CONFIGURED) {
    return FALLBACK_NEW_ARRIVAL_IDS.map((id) => FALLBACK_BOOKS.find((book) => book.bookId === id))
      .filter((book): book is BookCardData => Boolean(book))
      .slice(0, limit);
  }

  try {
    const books = await prisma.book.findMany({
      take: limit,
      orderBy: [{ publicationDate: "desc" }, { bookId: "desc" }],
      include: {
        authors: {
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return books.map((book) => mapPrismaBookToCard(book as PrismaBookWithAuthors));
  } catch (error) {
    console.warn("Falling back to local new-arrivals data:", error);
    return FALLBACK_NEW_ARRIVAL_IDS.map((id) => FALLBACK_BOOKS.find((book) => book.bookId === id))
      .filter((book): book is BookCardData => Boolean(book))
      .slice(0, limit);
  }
}

export async function getBooksCatalog(filters: BooksCatalogFilters) {
  if (!DATABASE_CONFIGURED) {
    return {
      books: filterFallbackBooks(filters),
      genres: getFallbackGenres(),
      languages: getFallbackLanguages(),
    };
  }

  try {
    const where = createBooksWhereInput(filters);

    const [books, genresRaw, languagesRaw] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy: [{ title: "asc" }],
        include: {
          authors: {
            include: {
              author: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      prisma.book.findMany({
        where: {
          genre: {
            not: null,
          },
        },
        select: {
          genre: true,
        },
        distinct: ["genre"],
        orderBy: {
          genre: "asc",
        },
      }),
      prisma.book.findMany({
        where: {
          language: {
            not: null,
          },
        },
        select: {
          language: true,
        },
        distinct: ["language"],
        orderBy: {
          language: "asc",
        },
      }),
    ]);

    return {
      books: books.map((book) => mapPrismaBookToCard(book as PrismaBookWithAuthors)),
      genres: genresRaw
        .map((entry) => entry.genre?.trim() ?? "")
        .filter((value): value is string => value.length > 0),
      languages: languagesRaw
        .map((entry) => entry.language?.trim() ?? "")
        .filter((value): value is string => value.length > 0),
    };
  } catch (error) {
    console.warn("Falling back to local books catalog data:", error);

    return {
      books: filterFallbackBooks(filters),
      genres: getFallbackGenres(),
      languages: getFallbackLanguages(),
    };
  }
}

export async function getBookDetails(bookId: number): Promise<BookDetailsData | null> {
  if (!Number.isFinite(bookId) || bookId <= 0) {
    return null;
  }

  if (!DATABASE_CONFIGURED) {
    return getFallbackBookDetails(bookId);
  }

  try {
    const book = await prisma.book.findUnique({
      where: { bookId },
      include: {
        publisher: {
          select: {
            name: true,
          },
        },
        authors: {
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        comments: {
          take: 40,
          orderBy: {
            commentDate: "desc",
          },
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!book) {
      return null;
    }

    const comments = book.comments.map((comment) => mapPrismaComment(comment as PrismaCommentWithCustomer));
    const ratings = comments.map((comment) => comment.rating).filter((rating) => rating > 0);
    const averageRating =
      ratings.length > 0
        ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1))
        : 0;

    const mappedCard = mapPrismaBookToCard(book as PrismaBookWithAuthors);

    return {
      ...mappedCard,
      description: book.description ?? "Опис відсутній",
      language: book.language ?? "-",
      publisherName: book.publisher?.name ?? "-",
      publicationDate: formatUADate(book.publicationDate),
      isbn: book.isbn ?? "-",
      pageCount: book.pageCount ?? 0,
      averageRating,
      comments,
    };
  } catch (error) {
    console.warn("Falling back to local book details data:", error);
    return getFallbackBookDetails(bookId);
  }
}

export async function getSimilarBooks(
  currentBookId: number,
  genre: string,
  limit = 5,
): Promise<BookCardData[]> {
  if (!DATABASE_CONFIGURED) {
    return getFallbackSimilarBooks(currentBookId, genre, limit);
  }

  try {
    const similar = await prisma.book.findMany({
      where: {
        bookId: {
          not: currentBookId,
        },
        ...(genre ? { genre } : {}),
      },
      take: limit,
      orderBy: [{ publicationDate: "desc" }, { bookId: "desc" }],
      include: {
        authors: {
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (similar.length === 0 && genre.length > 0) {
      const fallbackByRecency = await prisma.book.findMany({
        where: {
          bookId: {
            not: currentBookId,
          },
        },
        take: limit,
        orderBy: [{ publicationDate: "desc" }, { bookId: "desc" }],
        include: {
          authors: {
            include: {
              author: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      return fallbackByRecency.map((book) => mapPrismaBookToCard(book as PrismaBookWithAuthors));
    }

    return similar.map((book) => mapPrismaBookToCard(book as PrismaBookWithAuthors));
  } catch (error) {
    console.warn("Falling back to local similar books data:", error);
    return getFallbackSimilarBooks(currentBookId, genre, limit);
  }
}

export async function getAuthorsList(): Promise<AuthorCardData[]> {
  if (!DATABASE_CONFIGURED) {
    return [...FALLBACK_AUTHORS].sort((a, b) => compareUa(a.lastName, b.lastName));
  }

  try {
    const authors = await prisma.author.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        authorId: true,
        firstName: true,
        lastName: true,
        nationality: true,
        imagePath: true,
      },
    });

    return authors.map((author) => ({
      authorId: author.authorId,
      firstName: author.firstName,
      lastName: author.lastName,
      nationality: author.nationality ?? "",
      imagePath: author.imagePath ?? "",
    }));
  } catch (error) {
    console.warn("Falling back to local authors data:", error);
    return [...FALLBACK_AUTHORS].sort((a, b) => compareUa(a.lastName, b.lastName));
  }
}

export async function getAuthorDetails(authorId: number): Promise<AuthorDetailsData | null> {
  if (!Number.isFinite(authorId) || authorId <= 0) {
    return null;
  }

  if (!DATABASE_CONFIGURED) {
    return getFallbackAuthorDetails(authorId);
  }

  try {
    const author = await prisma.author.findUnique({
      where: { authorId },
      include: {
        authoredBooks: {
          include: {
            book: {
              include: {
                authors: {
                  include: {
                    author: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!author) {
      return null;
    }

    const books = author.authoredBooks
      .map((entry) => entry.book)
      .map((book) => mapPrismaBookToCard(book as PrismaBookWithAuthors))
      .sort((a, b) => compareUa(a.title, b.title));

    return {
      authorId: author.authorId,
      firstName: author.firstName,
      lastName: author.lastName,
      fullName: `${author.firstName} ${author.lastName}`.trim(),
      nationality: author.nationality ?? "",
      imagePath: author.imagePath ?? "",
      biography: author.biography ?? "Біографія відсутня",
      birthDate: formatUADate(author.birthDate),
      books,
    };
  } catch (error) {
    console.warn("Falling back to local author details data:", error);
    return getFallbackAuthorDetails(authorId);
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

  if (!DATABASE_CONFIGURED) {
    return getFallbackSearchSuggestions(trimmedQuery, limit);
  }

  try {
    const [books, authors] = await Promise.all([
      prisma.book.findMany({
        where: {
          OR: [
            { title: { contains: trimmedQuery, mode: "insensitive" } },
            {
              authors: {
                some: {
                  author: {
                    OR: [
                      { firstName: { contains: trimmedQuery, mode: "insensitive" } },
                      { lastName: { contains: trimmedQuery, mode: "insensitive" } },
                    ],
                  },
                },
              },
            },
          ],
        },
        take: limit,
        orderBy: [{ title: "asc" }],
        select: {
          bookId: true,
          title: true,
          coverImagePath: true,
          price: true,
        },
      }),
      prisma.author.findMany({
        where: {
          OR: [
            { firstName: { contains: trimmedQuery, mode: "insensitive" } },
            { lastName: { contains: trimmedQuery, mode: "insensitive" } },
          ],
        },
        take: limit,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: {
          authorId: true,
          firstName: true,
          lastName: true,
          imagePath: true,
        },
      }),
    ]);

    const suggestions: SearchSuggestionData[] = [
      ...books.map((book) => ({
        id: book.bookId,
        type: "book" as const,
        displayText: book.title,
        imagePath: book.coverImagePath ?? "",
        price: Number(book.price ?? 0),
      })),
      ...authors.map((author) => ({
        id: author.authorId,
        type: "author" as const,
        displayText: `${author.firstName} ${author.lastName}`.trim(),
        imagePath: author.imagePath ?? "",
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
  } catch (error) {
    console.warn("Falling back to local search suggestions:", error);
    return getFallbackSearchSuggestions(trimmedQuery, limit);
  }
}
