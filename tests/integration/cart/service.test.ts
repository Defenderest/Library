import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = { __tag: "transaction-client" };

  return {
    tx,
    queryRows: vi.fn(),
    queryFirst: vi.fn(),
    execute: vi.fn(),
    transaction: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (callback: (tx: unknown) => Promise<unknown>) => mocks.transaction(callback),
  },
}));

vi.mock("@/lib/db/raw", () => ({
  queryRows: mocks.queryRows,
  queryFirst: mocks.queryFirst,
  execute: mocks.execute,
}));

import {
  addCartItem,
  createStandardOrderFromCart,
  getCartSummary,
  mapCartServiceError,
} from "@/lib/cart/service";

describe("cart service integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback(mocks.tx));
  });

  it("builds cart summary totals from DB rows", async () => {
    mocks.queryRows.mockImplementation(async (_executor: unknown, sqlName: string) => {
      if (sqlName === "cart/get_cart_items") {
        return [
          {
            bookId: 10,
            quantity: 2,
            title: "Чистий код",
            price: 199.5,
            coverImagePath: "/covers/clean-code.jpg",
            stockQuantity: 4,
            authors: "Robert Martin",
          },
          {
            bookId: 11,
            quantity: 1,
            title: "Domain-Driven Design",
            price: "350",
            coverImagePath: null,
            stockQuantity: 3,
            authors: null,
          },
        ];
      }

      return [];
    });

    const summary = await getCartSummary(1);

    expect(summary.totalItems).toBe(3);
    expect(summary.totalPrice).toBe(749);
    expect(summary.items[1]?.author).toBe("Невідомий автор");
    expect(summary.items[1]?.coverImagePath).toBe("");
  });

  it("adds cart item and updates quantity within stock limits", async () => {
    mocks.queryFirst.mockImplementation(async (_executor: unknown, sqlName: string) => {
      if (sqlName === "cart/get_book_for_cart") {
        return {
          bookId: 7,
          title: "Алгоритми",
          stockQuantity: 5,
        };
      }

      if (sqlName === "cart/get_cart_item_quantity") {
        return {
          quantity: 2,
        };
      }

      return null;
    });

    mocks.queryRows.mockImplementation(async (_executor: unknown, sqlName: string) => {
      if (sqlName === "cart/get_cart_items") {
        return [
          {
            bookId: 7,
            quantity: 3,
            title: "Алгоритми",
            price: 420,
            coverImagePath: "/covers/algo.jpg",
            stockQuantity: 5,
            authors: "CLRS",
          },
        ];
      }

      return [];
    });

    const summary = await addCartItem(42, 7, 1);

    expect(summary.totalItems).toBe(3);
    expect(summary.totalPrice).toBe(1260);
    expect(mocks.execute).toHaveBeenCalledWith(mocks.tx, "cart/upsert_cart_item", [42, 7, 3]);
  });

  it("creates standard order and clears cart", async () => {
    const decrementedBookIds: number[] = [];

    mocks.queryRows.mockImplementation(async (_executor: unknown, sqlName: string) => {
      if (sqlName === "cart/get_checkout_cart_rows") {
        return [
          {
            bookId: 3,
            quantity: 2,
            title: "Refactoring",
            price: 250,
            stockQuantity: 10,
          },
          {
            bookId: 4,
            quantity: 1,
            title: "Patterns of Enterprise Application Architecture",
            price: "310.5",
            stockQuantity: 6,
          },
        ];
      }

      return [];
    });

    mocks.queryFirst.mockImplementation(async (_executor: unknown, sqlName: string, params?: unknown[]) => {
      if (sqlName === "cart/decrement_book_stock") {
        const bookId = Number(params?.[0]);
        decrementedBookIds.push(bookId);
        return { bookId };
      }

      if (sqlName === "cart/create_order") {
        return {
          orderId: 501,
        };
      }

      return null;
    });

    const result = await createStandardOrderFromCart(99, "Київ, Хрещатик, 1", "Готівка");

    expect(result).toEqual({
      orderId: 501,
      totalAmount: 810.5,
    });
    expect(decrementedBookIds).toEqual([3, 4]);

    expect(mocks.execute).toHaveBeenCalledWith(mocks.tx, "cart/create_order_item", [501, 3, 2, 250]);
    expect(mocks.execute).toHaveBeenCalledWith(mocks.tx, "cart/create_order_item", [501, 4, 1, 310.5]);
    expect(mocks.execute).toHaveBeenCalledWith(mocks.tx, "cart/create_order_status", [501, "Створено"]);
    expect(mocks.execute).toHaveBeenCalledWith(mocks.tx, "cart/clear_cart", [99]);
  });

  it("rejects LiqPay payment method in standard checkout", async () => {
    let capturedError: unknown = null;

    try {
      await createStandardOrderFromCart(5, "Київ, Хрещатик, 1", "LiqPay");
    } catch (error) {
      capturedError = error;
    }

    const mapped = mapCartServiceError(capturedError);

    expect(mapped.status).toBe(400);
    expect(mapped.message).toContain("LiqPay checkout");
  });

  it("allows only one successful checkout in stock race scenario", async () => {
    let stock = 1;
    let orderIdCounter = 700;

    mocks.queryRows.mockImplementation(async (_executor: unknown, sqlName: string) => {
      if (sqlName === "cart/get_checkout_cart_rows") {
        return [
          {
            bookId: 101,
            quantity: 1,
            title: "Concurrency in Practice",
            price: 500,
            stockQuantity: 1,
          },
        ];
      }

      return [];
    });

    mocks.queryFirst.mockImplementation(async (_executor: unknown, sqlName: string, params?: unknown[]) => {
      if (sqlName === "cart/decrement_book_stock") {
        const quantity = Number(params?.[1] ?? 0);

        if (stock >= quantity) {
          stock -= quantity;
          return { bookId: Number(params?.[0]) };
        }

        return null;
      }

      if (sqlName === "cart/create_order") {
        orderIdCounter += 1;
        return { orderId: orderIdCounter };
      }

      return null;
    });

    const [first, second] = await Promise.allSettled([
      createStandardOrderFromCart(1, "Київ, Поділ, 1", "Готівка"),
      createStandardOrderFromCart(2, "Львів, Стрийська, 2", "Готівка"),
    ]);

    const fulfilled = [first, second].filter((entry) => entry.status === "fulfilled");
    const rejected = [first, second].filter((entry) => entry.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(stock).toBe(0);

    if (rejected[0]?.status === "rejected") {
      const mapped = mapCartServiceError(rejected[0].reason);
      expect(mapped.status).toBe(409);
      expect(mapped.message).toContain("недоступна");
    }
  });
});
