import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionUser } from "@/lib/auth/types";

const mocks = vi.hoisted(() => ({
  getServerSessionUser: vi.fn(),
  getAdminUsersList: vi.fn(),
  mapAdminServiceError: vi.fn(),
}));

vi.mock("@/lib/auth/server-session", () => ({
  getServerSessionUser: mocks.getServerSessionUser,
}));

vi.mock("@/lib/admin/queries", () => ({
  getAdminUsersList: mocks.getAdminUsersList,
  mapAdminServiceError: mocks.mapAdminServiceError,
}));

import { GET } from "@/app/api/admin/users/route";

function createSession(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    customerId: overrides.customerId ?? 1,
    firstName: overrides.firstName ?? "Admin",
    lastName: overrides.lastName ?? "User",
    email: overrides.email ?? "admin@example.com",
    isAdmin: overrides.isAdmin ?? true,
  };
}

describe("GET /api/admin/users access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mapAdminServiceError.mockReturnValue({ status: 500, message: "Внутрішня помилка сервера" });
  });

  it("returns 401 when session is missing", async () => {
    mocks.getServerSessionUser.mockResolvedValue(null);

    const response = await GET();
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Увійдіть у профіль адміністратора");
    expect(mocks.getAdminUsersList).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not admin", async () => {
    mocks.getServerSessionUser.mockResolvedValue(createSession({ isAdmin: false }));

    const response = await GET();
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Недостатньо прав для адмін-дій");
    expect(mocks.getAdminUsersList).not.toHaveBeenCalled();
  });

  it("returns 200 and users list for admin session", async () => {
    const users = [
      {
        customerId: 12,
        firstName: "Ігор",
        lastName: "Пацера",
        email: "user@example.com",
        isAdmin: false,
      },
    ];

    mocks.getServerSessionUser.mockResolvedValue(createSession({ isAdmin: true }));
    mocks.getAdminUsersList.mockResolvedValue(users);

    const response = await GET();
    const payload = (await response.json()) as { users?: typeof users };

    expect(response.status).toBe(200);
    expect(payload.users).toEqual(users);
    expect(mocks.getAdminUsersList).toHaveBeenCalledTimes(1);
  });
});
