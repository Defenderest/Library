import { ZodError } from "zod";

import { createBookCommentSchema } from "@/lib/catalog/comment-validation";
import { queryFirst } from "@/lib/db/raw";
import { prisma } from "@/lib/prisma";

class BookCommentServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type CreateBookCommentParams = {
  bookId: number;
  customerId: number;
  reviewText: string;
  rating: number;
};

function assertPositiveId(value: number, message: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new BookCommentServiceError(message, 400);
  }

  return value;
}

export async function createBookComment(params: CreateBookCommentParams): Promise<{ commentId: number }> {
  const bookId = assertPositiveId(params.bookId, "Некоректний ідентифікатор книги");
  const customerId = assertPositiveId(params.customerId, "Некоректний ідентифікатор користувача");

  const validated = createBookCommentSchema.parse({
    reviewText: params.reviewText,
    rating: params.rating,
  });

  return prisma.$transaction(async (tx) => {
    const book = await queryFirst<{ bookId: number }>(tx, "catalog/get_book_exists", [bookId]);
    if (!book) {
      throw new BookCommentServiceError("Книгу не знайдено", 404);
    }

    const duplicate = await queryFirst<{ commentId: number }>(tx, "catalog/get_book_comment_duplicate", [
      bookId,
      customerId,
    ]);

    if (duplicate) {
      throw new BookCommentServiceError("Ви вже залишили відгук для цієї книги", 409);
    }

    const created = await queryFirst<{ commentId: number }>(tx, "catalog/create_book_comment", [
      bookId,
      customerId,
      validated.reviewText,
      validated.rating,
    ]);

    if (!created) {
      throw new BookCommentServiceError("Не вдалося зберегти відгук", 500);
    }

    return created;
  });
}

export function mapBookCommentServiceError(error: unknown): { status: number; message: string } {
  if (error instanceof BookCommentServiceError) {
    return {
      status: error.status,
      message: error.message,
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      message: error.issues[0]?.message || "Некоректні дані відгуку",
    };
  }

  console.error("Book comment service error:", error);
  return {
    status: 500,
    message: "Внутрішня помилка сервера",
  };
}
