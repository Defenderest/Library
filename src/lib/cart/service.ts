import { Prisma } from "@prisma/client";

import type { CartSummaryData, CheckoutResult } from "@/lib/cart/types";
import type { PaymentMethod } from "@/lib/cart/validation";
import { prisma } from "@/lib/prisma";

type CartQuantityAction = "increase" | "decrease" | "set";

class CartServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function toMoney(value: Prisma.Decimal | number | null | undefined): number {
  return Number(value ?? 0);
}

function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
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

  if (names.length === 0) {
    return "Невідомий автор";
  }

  return names.join(", ");
}

export async function getCartSummary(customerId: number): Promise<CartSummaryData> {
  const cartRows = await prisma.cartItem.findMany({
    where: {
      customerId,
    },
    orderBy: {
      addedDate: "desc",
    },
    include: {
      book: {
        select: {
          bookId: true,
          title: true,
          price: true,
          coverImagePath: true,
          stockQuantity: true,
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
  });

  const items = cartRows
    .filter((row) => Boolean(row.book))
    .map((row) => {
      const price = toMoney(row.book.price);
      const subtotal = Number((price * row.quantity).toFixed(2));

      return {
        bookId: row.book.bookId,
        title: row.book.title,
        author: mapAuthors(row.book.authors),
        price,
        quantity: row.quantity,
        coverImagePath: row.book.coverImagePath ?? "",
        subtotal,
        stockQuantity: row.book.stockQuantity,
      };
    });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));

  return {
    items,
    totalItems,
    totalPrice,
  };
}

export async function addCartItem(
  customerId: number,
  bookId: number,
  quantity = 1,
): Promise<CartSummaryData> {
  if (!Number.isInteger(bookId) || bookId <= 0) {
    throw new CartServiceError("Некоректний ідентифікатор книги", 400);
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new CartServiceError("Некоректна кількість", 400);
  }

  await prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({
      where: {
        bookId,
      },
      select: {
        bookId: true,
        title: true,
        stockQuantity: true,
      },
    });

    if (!book) {
      throw new CartServiceError("Книгу не знайдено", 404);
    }

    if (book.stockQuantity <= 0) {
      throw new CartServiceError("Книги немає в наявності", 409);
    }

    const existing = await tx.cartItem.findUnique({
      where: {
        customerId_bookId: {
          customerId,
          bookId,
        },
      },
      select: {
        quantity: true,
      },
    });

    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > book.stockQuantity) {
      throw new CartServiceError(
        `Книга "${book.title}" вже недоступна у потрібній кількості`,
        409,
      );
    }

    await tx.cartItem.upsert({
      where: {
        customerId_bookId: {
          customerId,
          bookId,
        },
      },
      update: {
        quantity: nextQuantity,
      },
      create: {
        customerId,
        bookId,
        quantity: nextQuantity,
      },
    });
  });

  return getCartSummary(customerId);
}

export async function updateCartItemQuantity(
  customerId: number,
  bookId: number,
  action: CartQuantityAction,
  quantity?: number,
): Promise<CartSummaryData> {
  if (!Number.isInteger(bookId) || bookId <= 0) {
    throw new CartServiceError("Некоректний ідентифікатор книги", 400);
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.cartItem.findUnique({
      where: {
        customerId_bookId: {
          customerId,
          bookId,
        },
      },
      select: {
        quantity: true,
      },
    });

    if (!existing) {
      throw new CartServiceError("Позицію не знайдено у кошику", 404);
    }

    let nextQuantity = existing.quantity;

    if (action === "increase") {
      nextQuantity = existing.quantity + 1;
    }

    if (action === "decrease") {
      nextQuantity = existing.quantity - 1;
    }

    if (action === "set") {
      if (!Number.isInteger(quantity) || typeof quantity !== "number") {
        throw new CartServiceError("Некоректна кількість", 400);
      }
      nextQuantity = quantity;
    }

    if (nextQuantity <= 0) {
      await tx.cartItem.delete({
        where: {
          customerId_bookId: {
            customerId,
            bookId,
          },
        },
      });
      return;
    }

    const book = await tx.book.findUnique({
      where: {
        bookId,
      },
      select: {
        title: true,
        stockQuantity: true,
      },
    });

    if (!book) {
      throw new CartServiceError("Книгу не знайдено", 404);
    }

    if (nextQuantity > book.stockQuantity) {
      throw new CartServiceError(
        `Книга "${book.title}" вже недоступна у потрібній кількості`,
        409,
      );
    }

    await tx.cartItem.update({
      where: {
        customerId_bookId: {
          customerId,
          bookId,
        },
      },
      data: {
        quantity: nextQuantity,
      },
    });
  });

  return getCartSummary(customerId);
}

export async function removeCartItem(customerId: number, bookId: number): Promise<CartSummaryData> {
  if (!Number.isInteger(bookId) || bookId <= 0) {
    throw new CartServiceError("Некоректний ідентифікатор книги", 400);
  }

  await prisma.cartItem.deleteMany({
    where: {
      customerId,
      bookId,
    },
  });

  return getCartSummary(customerId);
}

export async function clearCart(customerId: number): Promise<CartSummaryData> {
  await prisma.cartItem.deleteMany({
    where: {
      customerId,
    },
  });

  return getCartSummary(customerId);
}

export async function createStandardOrderFromCart(
  customerId: number,
  shippingAddress: string,
  paymentMethod: PaymentMethod,
): Promise<CheckoutResult> {
  if (paymentMethod === "LiqPay Sandbox") {
    throw new CartServiceError("LiqPay Sandbox буде доступний у наступній фазі", 400);
  }

  return prisma.$transaction(async (tx) => {
    const cartRows = await tx.cartItem.findMany({
      where: {
        customerId,
      },
      include: {
        book: {
          select: {
            bookId: true,
            title: true,
            price: true,
            stockQuantity: true,
          },
        },
      },
      orderBy: {
        addedDate: "desc",
      },
    });

    if (cartRows.length === 0) {
      throw new CartServiceError("Кошик порожній", 409);
    }

    let totalAmount = 0;

    for (const row of cartRows) {
      if (!row.book) {
        throw new CartServiceError("Одна з книг у кошику більше недоступна", 409);
      }

      if (row.quantity <= 0) {
        throw new CartServiceError("Кошик містить некоректну кількість товару", 409);
      }

      const updated = await tx.book.updateMany({
        where: {
          bookId: row.bookId,
          stockQuantity: {
            gte: row.quantity,
          },
        },
        data: {
          stockQuantity: {
            decrement: row.quantity,
          },
        },
      });

      if (updated.count === 0) {
        throw new CartServiceError(
          `Книга "${row.book.title}" вже недоступна у потрібній кількості`,
          409,
        );
      }

      const itemPrice = toMoney(row.book.price);
      totalAmount += itemPrice * row.quantity;
    }

    const normalizedTotalAmount = Number(totalAmount.toFixed(2));

    const order = await tx.order.create({
      data: {
        customerId,
        shippingAddress,
        paymentMethod,
        totalAmount: toDecimal(normalizedTotalAmount),
      },
      select: {
        orderId: true,
      },
    });

    await tx.orderItem.createMany({
      data: cartRows.map((row) => ({
        orderId: order.orderId,
        bookId: row.bookId,
        quantity: row.quantity,
        pricePerUnit: toDecimal(toMoney(row.book?.price ?? 0)),
      })),
    });

    await tx.orderStatus.create({
      data: {
        orderId: order.orderId,
        status: "Створено",
      },
    });

    await tx.cartItem.deleteMany({
      where: {
        customerId,
      },
    });

    return {
      orderId: order.orderId,
      totalAmount: normalizedTotalAmount,
    };
  });
}

export function mapCartServiceError(error: unknown): { status: number; message: string } {
  if (error instanceof CartServiceError) {
    return {
      status: error.status,
      message: error.message,
    };
  }

  console.error("Cart service error:", error);
  return {
    status: 500,
    message: "Внутрішня помилка сервера",
  };
}
