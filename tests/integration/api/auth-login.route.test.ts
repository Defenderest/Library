import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryFirst: vi.fn(),
  execute: vi.fn(),
  verifyPasswordHash: vi.fn(),
  passwordHashNeedsUpgrade: vi.fn(),
  createPasswordHash: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("@/lib/db/raw", () => ({
  queryFirst: mocks.queryFirst,
  execute: mocks.execute,
}));

vi.mock("@/lib/auth/password", () => ({
  verifyPasswordHash: mocks.verifyPasswordHash,
  passwordHashNeedsUpgrade: mocks.passwordHashNeedsUpgrade,
  createPasswordHash: mocks.createPasswordHash,
}));

import { POST } from "@/app/api/auth/login/route";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

function requestWithBody(body: unknown): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.passwordHashNeedsUpgrade.mockReturnValue(false);
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(requestWithBody({ email: "", password: "" }));
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Введіть email та пароль");
  });

  it("returns 401 for invalid credentials", async () => {
    mocks.queryFirst.mockResolvedValue({
      customerId: 5,
      firstName: "Ігор",
      lastName: "Пацера",
      email: "user@example.com",
      isAdmin: false,
      passwordHash: "hash",
    });
    mocks.verifyPasswordHash.mockReturnValue(false);

    const response = await POST(requestWithBody({ email: "user@example.com", password: "wrong" }));
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Невірний email або пароль");
  });

  it("returns session and sets cookie on successful login", async () => {
    mocks.queryFirst.mockResolvedValue({
      customerId: 5,
      firstName: "Ігор",
      lastName: "Пацера",
      email: "user@example.com",
      isAdmin: true,
      passwordHash: "hash",
    });
    mocks.verifyPasswordHash.mockReturnValue(true);

    const response = await POST(requestWithBody({ email: "user@example.com", password: "Pass1234" }));
    const payload = (await response.json()) as {
      session?: {
        customerId: number;
        firstName: string;
        isAdmin: boolean;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.session?.customerId).toBe(5);
    expect(payload.session?.firstName).toBe("Ігор");
    expect(payload.session?.isAdmin).toBe(true);
    expect(response.headers.get("set-cookie")).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("upgrades legacy password hash when needed", async () => {
    mocks.queryFirst.mockResolvedValue({
      customerId: 5,
      firstName: "Ігор",
      lastName: "Пацера",
      email: "user@example.com",
      isAdmin: false,
      passwordHash: "legacy-hash",
    });
    mocks.verifyPasswordHash.mockReturnValue(true);
    mocks.passwordHashNeedsUpgrade.mockReturnValue(true);
    mocks.createPasswordHash.mockReturnValue("upgraded-hash");

    const response = await POST(requestWithBody({ email: "user@example.com", password: "Pass1234" }));

    expect(response.status).toBe(200);
    expect(mocks.execute).toHaveBeenCalledWith({}, "auth/update_customer_password_hash", [5, "upgraded-hash"]);
  });
});
