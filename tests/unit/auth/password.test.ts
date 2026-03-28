import { createHash } from "crypto";

import { describe, expect, it } from "vitest";

import { createPasswordHash, passwordHashNeedsUpgrade, verifyPasswordHash } from "@/lib/auth/password";

describe("password hashing", () => {
  it("creates a pbkdf2 hash that verifies the original password", () => {
    const password = "TestPassword123!";
    const hash = createPasswordHash(password);

    expect(hash.startsWith("pbkdf2_sha256$")).toBe(true);
    expect(verifyPasswordHash(password, hash)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const hash = createPasswordHash("CorrectHorseBatteryStaple");

    expect(verifyPasswordHash("WrongPassword", hash)).toBe(false);
  });

  it("supports legacy sha256 hashes and marks them for upgrade", () => {
    const password = "legacy-password";
    const legacyHash = createHash("sha256").update(password).digest("hex");

    expect(verifyPasswordHash(password, legacyHash)).toBe(true);
    expect(passwordHashNeedsUpgrade(legacyHash)).toBe(true);
  });
});
