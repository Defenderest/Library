import { describe, expect, it } from "vitest";

import {
  isStrongPassword,
  normalizePhone,
  validateLoginPayload,
  validateProfileUpdatePayload,
  validateRegistrationPayload,
} from "@/lib/auth/validation";

describe("auth validation", () => {
  it("normalizes login payload email", () => {
    const result = validateLoginPayload({
      email: "  USER@Example.COM ",
      password: "secret-123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("user@example.com");
      expect(result.data.password).toBe("secret-123");
    }
  });

  it("rejects login payload when fields are empty", () => {
    const result = validateLoginPayload({ email: "", password: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Введіть email та пароль");
    }
  });

  it("accepts registration payload and normalizes phone", () => {
    const result = validateRegistrationPayload({
      firstName: "Ігор",
      lastName: "Пацера",
      email: "User@Example.com",
      phone: "00 380 (67) 123-45-67",
      password: "Pass1234",
      confirmPassword: "Pass1234",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("user@example.com");
      expect(result.data.phone).toBe("+380671234567");
    }
  });

  it("rejects registration payload when passwords do not match", () => {
    const result = validateRegistrationPayload({
      firstName: "Ігор",
      lastName: "Пацера",
      email: "user@example.com",
      phone: "+380671234567",
      password: "Pass1234",
      confirmPassword: "Pass12345",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Паролі не співпадають");
    }
  });

  it("validates profile update payload", () => {
    const result = validateProfileUpdatePayload({
      firstName: "Ігор",
      lastName: "Пацера",
      phone: " +380 67 123 45 67 ",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.phone).toBe("+380671234567");
    }
  });

  it("checks password strength requirements", () => {
    expect(isStrongPassword("abcd1234")).toBe(true);
    expect(isStrongPassword("onlyletters")).toBe(false);
    expect(isStrongPassword("12345678")).toBe(false);
    expect(isStrongPassword("short1")).toBe(false);
  });

  it("normalizes phone prefixes with 00", () => {
    expect(normalizePhone("00380671234567")).toBe("+380671234567");
  });
});
