import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createSessionToken, verifySessionToken } from "@/lib/auth/session";

describe("session tokens", () => {
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    process.env.SESSION_SECRET = "unit-test-secret";
  });

  afterEach(() => {
    process.env.SESSION_SECRET = originalSecret;
  });

  it("creates a valid token for a customer id", () => {
    const token = createSessionToken(42);
    const payload = verifySessionToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.customerId).toBe(42);
  });

  it("rejects a token with a tampered signature", () => {
    const token = createSessionToken(17);
    const [payload, signature] = token.split(".");
    const mutatedSignature = `${signature.slice(0, -1)}${signature.endsWith("a") ? "b" : "a"}`;

    expect(verifySessionToken(`${payload}.${mutatedSignature}`)).toBeNull();
  });
});
