import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionUser } from "@/lib/auth/types";

const mocks = vi.hoisted(() => ({
  getServerSessionUser: vi.fn(),
  queryFirst: vi.fn(),
}));

vi.mock("@/lib/auth/server-session", () => ({
  getServerSessionUser: mocks.getServerSessionUser,
}));

vi.mock("@/lib/db/raw", () => ({
  queryFirst: mocks.queryFirst,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import { GET } from "@/app/api/profile/route";

function createSession(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    customerId: overrides.customerId ?? 1,
    firstName: overrides.firstName ?? "User",
    lastName: overrides.lastName ?? "Profile",
    email: overrides.email ?? "user@example.com",
    isAdmin: overrides.isAdmin ?? false,
  };
}

describe("GET /api/profile access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mocks.getServerSessionUser.mockResolvedValue(null);

    const response = await GET();
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Спочатку увійдіть у профіль");
    expect(mocks.queryFirst).not.toHaveBeenCalled();
  });

  it("returns 200 with normalized profile for authenticated user", async () => {
    mocks.getServerSessionUser.mockResolvedValue(createSession({ customerId: 55 }));
    mocks.queryFirst.mockResolvedValue({
      customerId: 55,
      firstName: "Тест",
      lastName: "Користувач",
      email: "test@example.com",
      phone: null,
      address: null,
      joinDate: "2025-01-01T00:00:00.000Z",
      loyaltyProgram: true,
      loyaltyPoints: 12,
    });

    const response = await GET();
    const payload = (await response.json()) as {
      profile?: {
        customerId: number;
        email: string;
        phone: string;
        loyaltyProgram: boolean;
        loyaltyPoints: number;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.profile?.customerId).toBe(55);
    expect(payload.profile?.email).toBe("test@example.com");
    expect(payload.profile?.phone).toBe("");
    expect(payload.profile?.loyaltyProgram).toBe(true);
    expect(payload.profile?.loyaltyPoints).toBe(12);
    expect(mocks.queryFirst).toHaveBeenCalledWith({}, "profile/get_customer_profile", [55]);
  });
});
