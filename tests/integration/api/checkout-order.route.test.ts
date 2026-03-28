import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSessionUser: vi.fn(),
  createStandardOrderFromCart: vi.fn(),
  mapCartServiceError: vi.fn(),
}));

vi.mock("@/lib/auth/server-session", () => ({
  getServerSessionUser: mocks.getServerSessionUser,
}));

vi.mock("@/lib/cart/service", () => ({
  createStandardOrderFromCart: mocks.createStandardOrderFromCart,
  mapCartServiceError: mocks.mapCartServiceError,
}));

import { POST } from "@/app/api/checkout/order/route";

function requestWithBody(body: unknown): Request {
  return new Request("http://localhost/api/checkout/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout/order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mapCartServiceError.mockReturnValue({
      status: 500,
      message: "Внутрішня помилка сервера",
    });
  });

  it("returns 401 for unauthenticated users", async () => {
    mocks.getServerSessionUser.mockResolvedValue(null);

    const response = await POST(requestWithBody({}));
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(payload.error).toContain("увійдіть у профіль");
  });

  it("returns 400 when checkout payload is invalid", async () => {
    mocks.getServerSessionUser.mockResolvedValue({ customerId: 101 });

    const response = await POST(requestWithBody({ city: "", street: "", house: "", paymentMethod: "Готівка" }));
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBeTruthy();
    expect(mocks.createStandardOrderFromCart).not.toHaveBeenCalled();
  });

  it("returns 400 for LiqPay payment in standard checkout route", async () => {
    mocks.getServerSessionUser.mockResolvedValue({ customerId: 101 });

    const response = await POST(
      requestWithBody({
        city: "Київ",
        street: "Хрещатик",
        house: "1",
        paymentMethod: "LiqPay",
      }),
    );
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("LiqPay checkout");
    expect(mocks.createStandardOrderFromCart).not.toHaveBeenCalled();
  });

  it("creates order for valid payload", async () => {
    mocks.getServerSessionUser.mockResolvedValue({ customerId: 101 });
    mocks.createStandardOrderFromCart.mockResolvedValue({ orderId: 88, totalAmount: 540.5 });

    const response = await POST(
      requestWithBody({
        city: "Київ",
        street: "Хрещатик",
        house: "1",
        paymentMethod: "Готівка",
      }),
    );
    const payload = (await response.json()) as {
      orderId?: number;
      totalAmount?: number;
      message?: string;
    };

    expect(response.status).toBe(200);
    expect(payload.orderId).toBe(88);
    expect(payload.totalAmount).toBe(540.5);
    expect(payload.message).toContain("#88");
    expect(mocks.createStandardOrderFromCart).toHaveBeenCalledWith(101, "Київ, Хрещатик, 1", "Готівка");
  });

  it("maps cart service errors to response status", async () => {
    const failure = new Error("boom");
    mocks.getServerSessionUser.mockResolvedValue({ customerId: 101 });
    mocks.createStandardOrderFromCart.mockRejectedValue(failure);
    mocks.mapCartServiceError.mockReturnValue({ status: 409, message: "Кошик порожній" });

    const response = await POST(
      requestWithBody({
        city: "Київ",
        street: "Хрещатик",
        house: "1",
        paymentMethod: "Готівка",
      }),
    );
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(409);
    expect(payload.error).toBe("Кошик порожній");
    expect(mocks.mapCartServiceError).toHaveBeenCalledWith(failure);
  });
});
