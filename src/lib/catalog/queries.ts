import { Prisma } from "@prisma/client";

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

function compareUa(a: string, b: string): number {
  return a.localeCompare(b, "uk", { sensitivity: "base" });
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
    console.warn("Failed to load new arrivals from database:", error);
    return [];
  }
}

export async function getBooksCatalog(filters: BooksCatalogFilters) {
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
    console.warn("Failed to load books catalog from database:", error);

    return {
      books: [],
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
    console.warn("Failed to load similar books from database:", error);
    return [];
  }
}

export async function getAuthorsList(): Promise<AuthorCardData[]> {
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
    console.warn("Failed to load authors from database:", error);
    return [];
  }
}

export async function getAuthorDetails(authorId: number): Promise<AuthorDetailsData | null> {
  if (!Number.isFinite(authorId) || authorId <= 0) {
    return null;
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
    console.warn("Failed to load search suggestions from database:", error);
    return [];
  }
}
