import type { CartSummaryData, CheckoutResult } from "@/lib/cart/types";
import type { PaymentMethod } from "@/lib/cart/validation";
import { execute, queryFirst, queryRows } from "@/lib/db/raw";
import { prisma } from "@/lib/prisma";

type CartQuantityAction = "increase" | "decrease" | "set";

class CartServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function toMoney(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

type CartItemRow = {
  bookId: number;
  quantity: number;
  title: string;
  price: number | string | null;
  coverImagePath: string | null;
  stockQuantity: number | null;
  authors: string | null;
};

type CartBookRow = {
  bookId: number;
  title: string;
  stockQuantity: number | null;
};

type CartQuantityRow = {
  quantity: number;
};

type CheckoutCartRow = {
  bookId: number;
  quantity: number;
  title: string;
  price: number | string | null;
  stockQuantity: number | null;
};

type CreatedOrderRow = {
  orderId: number;
};

function asNonNegativeInteger(value: number | null | undefined): number {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.floor(numeric);
}

export async function getCartSummary(customerId: number): Promise<CartSummaryData> {
  const cartRows = await queryRows<CartItemRow>(prisma, "cart/get_cart_items", [customerId]);

  const items = cartRows.map((row) => {
      const price = toMoney(row.price);
      const subtotal = Number((price * row.quantity).toFixed(2));

      return {
        bookId: row.bookId,
        title: row.title,
        author: row.authors?.trim() || "Невідомий автор",
        price,
        quantity: row.quantity,
        coverImagePath: row.coverImagePath ?? "",
        subtotal,
        stockQuantity: asNonNegativeInteger(row.stockQuantity),
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
    const book = await queryFirst<CartBookRow>(tx, "cart/get_book_for_cart", [bookId]);

    if (!book) {
      throw new CartServiceError("Книгу не знайдено", 404);
    }

    if (asNonNegativeInteger(book.stockQuantity) <= 0) {
      throw new CartServiceError("Книги немає в наявності", 409);
    }

    const existing = await queryFirst<CartQuantityRow>(tx, "cart/get_cart_item_quantity", [
      customerId,
      bookId,
    ]);

    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > asNonNegativeInteger(book.stockQuantity)) {
      throw new CartServiceError(
        `Книга "${book.title}" вже недоступна у потрібній кількості`,
        409,
      );
    }

    await execute(tx, "cart/upsert_cart_item", [customerId, bookId, nextQuantity]);
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
    const existing = await queryFirst<CartQuantityRow>(tx, "cart/get_cart_item_quantity", [
      customerId,
      bookId,
    ]);

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
      await execute(tx, "cart/delete_cart_item", [customerId, bookId]);
      return;
    }

    const book = await queryFirst<CartBookRow>(tx, "cart/get_book_for_cart", [bookId]);

    if (!book) {
      throw new CartServiceError("Книгу не знайдено", 404);
    }

    if (nextQuantity > asNonNegativeInteger(book.stockQuantity)) {
      throw new CartServiceError(
        `Книга "${book.title}" вже недоступна у потрібній кількості`,
        409,
      );
    }

    await execute(tx, "cart/update_cart_item_quantity", [customerId, bookId, nextQuantity]);
  });

  return getCartSummary(customerId);
}

export async function removeCartItem(customerId: number, bookId: number): Promise<CartSummaryData> {
  if (!Number.isInteger(bookId) || bookId <= 0) {
    throw new CartServiceError("Некоректний ідентифікатор книги", 400);
  }

  await execute(prisma, "cart/delete_cart_item", [customerId, bookId]);

  return getCartSummary(customerId);
}

export async function clearCart(customerId: number): Promise<CartSummaryData> {
  await execute(prisma, "cart/clear_cart", [customerId]);

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
    const cartRows = await queryRows<CheckoutCartRow>(tx, "cart/get_checkout_cart_rows", [customerId]);

    if (cartRows.length === 0) {
      throw new CartServiceError("Кошик порожній", 409);
    }

    let totalAmount = 0;

    for (const row of cartRows) {
      if (row.quantity <= 0) {
        throw new CartServiceError("Кошик містить некоректну кількість товару", 409);
      }

      const updatedStock = await queryFirst<{ bookId: number }>(tx, "cart/decrement_book_stock", [
        row.bookId,
        row.quantity,
      ]);

      if (!updatedStock) {
        throw new CartServiceError(
          `Книга "${row.title}" вже недоступна у потрібній кількості`,
          409,
        );
      }

      const itemPrice = toMoney(row.price);
      totalAmount += itemPrice * row.quantity;
    }

    const normalizedTotalAmount = Number(totalAmount.toFixed(2));

    const order = await queryFirst<CreatedOrderRow>(tx, "cart/create_order", [
      customerId,
      normalizedTotalAmount,
      shippingAddress,
      paymentMethod,
    ]);

    if (!order) {
      throw new CartServiceError("Не вдалося створити замовлення", 500);
    }

    for (const row of cartRows) {
      await execute(tx, "cart/create_order_item", [
        order.orderId,
        row.bookId,
        row.quantity,
        toMoney(row.price),
      ]);
    }

    await execute(tx, "cart/create_order_status", [order.orderId, "Створено"]);

    await execute(tx, "cart/clear_cart", [customerId]);

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
