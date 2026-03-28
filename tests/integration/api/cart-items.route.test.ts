import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSessionUser: vi.fn(),
  addCartItem: vi.fn(),
  mapCartServiceError: vi.fn(),
}));

vi.mock("@/lib/auth/server-session", () => ({
  getServerSessionUser: mocks.getServerSessionUser,
}));

vi.mock("@/lib/cart/service", () => ({
  addCartItem: mocks.addCartItem,
  mapCartServiceError: mocks.mapCartServiceError,
}));

import { POST } from "@/app/api/cart/items/route";

function requestWithBody(body: unknown): Request {
  return new Request("http://localhost/api/cart/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/cart/items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mapCartServiceError.mockReturnValue({
      status: 500,
      message: "Внутрішня помилка сервера",
    });
  });

  it("returns 401 for unauthenticated users", async () => {
    mocks.getServerSessionUser.mockResolvedValue(null);

    const response = await POST(requestWithBody({ bookId: 1, quantity: 1 }));
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(payload.error).toContain("увійдіть у профіль");
  });

  it("adds cart item for authenticated users", async () => {
    const cart = {
      items: [],
      totalItems: 3,
      totalPrice: 450,
    };

    mocks.getServerSessionUser.mockResolvedValue({ customerId: 77 });
    mocks.addCartItem.mockResolvedValue(cart);

    const response = await POST(requestWithBody({ bookId: 12, quantity: 2 }));
    const payload = (await response.json()) as { cart?: typeof cart };

    expect(response.status).toBe(200);
    expect(payload.cart).toEqual(cart);
    expect(mocks.addCartItem).toHaveBeenCalledWith(77, 12, 2);
  });

  it("uses default quantity 1 when quantity is missing", async () => {
    mocks.getServerSessionUser.mockResolvedValue({ customerId: 77 });
    mocks.addCartItem.mockResolvedValue({ items: [], totalItems: 1, totalPrice: 100 });

    await POST(requestWithBody({ bookId: 99 }));

    expect(mocks.addCartItem).toHaveBeenCalledWith(77, 99, 1);
  });

  it("maps cart service errors to response payload", async () => {
    const failure = new Error("stock conflict");
    mocks.getServerSessionUser.mockResolvedValue({ customerId: 77 });
    mocks.addCartItem.mockRejectedValue(failure);
    mocks.mapCartServiceError.mockReturnValue({ status: 409, message: "Книги немає в наявності" });

    const response = await POST(requestWithBody({ bookId: 12, quantity: 2 }));
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(409);
    expect(payload.error).toBe("Книги немає в наявності");
    expect(mocks.mapCartServiceError).toHaveBeenCalledWith(failure);
  });
});
