import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionUser } from "@/lib/auth/types";

const mocks = vi.hoisted(() => ({
  getServerSessionUser: vi.fn(),
  getCartSummary: vi.fn(),
  clearCart: vi.fn(),
  mapCartServiceError: vi.fn(),
}));

vi.mock("@/lib/auth/server-session", () => ({
  getServerSessionUser: mocks.getServerSessionUser,
}));

vi.mock("@/lib/cart/service", () => ({
  getCartSummary: mocks.getCartSummary,
  clearCart: mocks.clearCart,
  mapCartServiceError: mocks.mapCartServiceError,
}));

import { DELETE, GET } from "@/app/api/cart/route";

function createSession(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    customerId: overrides.customerId ?? 1,
    firstName: overrides.firstName ?? "User",
    lastName: overrides.lastName ?? "Cart",
    email: overrides.email ?? "cart@example.com",
    isAdmin: overrides.isAdmin ?? false,
  };
}

describe("/api/cart access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mapCartServiceError.mockReturnValue({ status: 500, message: "Внутрішня помилка сервера" });
  });

  it("GET returns 401 when session is missing", async () => {
    mocks.getServerSessionUser.mockResolvedValue(null);

    const response = await GET();
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Щоб працювати з кошиком, увійдіть у профіль");
    expect(mocks.getCartSummary).not.toHaveBeenCalled();
  });

  it("GET returns 200 for authenticated user", async () => {
    const cart = {
      items: [],
      totalItems: 2,
      totalPrice: 340,
    };

    mocks.getServerSessionUser.mockResolvedValue(createSession({ customerId: 33 }));
    mocks.getCartSummary.mockResolvedValue(cart);

    const response = await GET();
    const payload = (await response.json()) as { cart?: typeof cart };

    expect(response.status).toBe(200);
    expect(payload.cart).toEqual(cart);
    expect(mocks.getCartSummary).toHaveBeenCalledWith(33);
  });

  it("DELETE returns 401 when session is missing", async () => {
    mocks.getServerSessionUser.mockResolvedValue(null);

    const response = await DELETE();
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Щоб працювати з кошиком, увійдіть у профіль");
    expect(mocks.clearCart).not.toHaveBeenCalled();
  });

  it("DELETE returns 200 for authenticated user", async () => {
    const cart = {
      items: [],
      totalItems: 0,
      totalPrice: 0,
    };

    mocks.getServerSessionUser.mockResolvedValue(createSession({ customerId: 44 }));
    mocks.clearCart.mockResolvedValue(cart);

    const response = await DELETE();
    const payload = (await response.json()) as { cart?: typeof cart };

    expect(response.status).toBe(200);
    expect(payload.cart).toEqual(cart);
    expect(mocks.clearCart).toHaveBeenCalledWith(44);
  });
});
