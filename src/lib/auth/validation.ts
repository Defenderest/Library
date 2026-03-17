import { z } from "zod";

const NAME_PATTERN = /^[\p{L}'\-\s]+$/u;
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

export function normalizePhone(value: string): string {
  let normalized = value.trim().replace(/[\s\-()]/g, "");

  if (normalized.startsWith("00")) {
    normalized = `+${normalized.slice(2)}`;
  }

  return normalized;
}

export function isValidName(value: string): boolean {
  const normalized = value.trim();
  return normalized.length >= 2 && normalized.length <= 40 && NAME_PATTERN.test(normalized);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(normalizePhone(value));
}

export function isStrongPassword(value: string): boolean {
  if (value.length < 8) {
    return false;
  }

  const hasLetter = /[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  return hasLetter && hasDigit;
}

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Введіть email")
    .email("Вкажіть коректний email"),
  password: z.string().min(1, "Введіть пароль"),
});

export const registerFormSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "Ім'я має містити від 2 символів")
      .max(40, "Ім'я має містити до 40 символів")
      .regex(NAME_PATTERN, "Ім'я може містити лише літери, пробіл, апостроф або дефіс"),
    lastName: z
      .string()
      .trim()
      .min(2, "Прізвище має містити від 2 символів")
      .max(40, "Прізвище має містити до 40 символів")
      .regex(NAME_PATTERN, "Прізвище може містити лише літери, пробіл, апостроф або дефіс"),
    email: z
      .string()
      .trim()
      .min(1, "Введіть email")
      .email("Вкажіть коректний email"),
    phone: z
      .string()
      .trim()
      .min(1, "Введіть номер телефону")
      .refine((value) => PHONE_PATTERN.test(normalizePhone(value)), "Вкажіть коректний номер телефону"),
    password: z
      .string()
      .min(8, "Пароль має містити щонайменше 8 символів")
      .refine((value) => isStrongPassword(value), "Пароль має містити літери та цифри"),
    confirmPassword: z.string().min(1, "Підтвердіть пароль"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Паролі не співпадають",
  });

export const profileFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Ім'я має містити від 2 символів")
    .max(40, "Ім'я має містити до 40 символів")
    .regex(NAME_PATTERN, "Ім'я може містити лише літери, пробіл, апостроф або дефіс"),
  lastName: z
    .string()
    .trim()
    .min(2, "Прізвище має містити від 2 символів")
    .max(40, "Прізвище має містити до 40 символів")
    .regex(NAME_PATTERN, "Прізвище може містити лише літери, пробіл, апостроф або дефіс"),
  phone: z
    .string()
    .trim()
    .min(1, "Введіть номер телефону")
    .refine((value) => PHONE_PATTERN.test(normalizePhone(value)), "Невірний формат телефону. Приклад: +380XXXXXXXXX"),
});

type UnknownRecord = Record<string, unknown>;

function getString(record: UnknownRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

export function validateLoginPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { ok: false as const, error: "Введіть email та пароль" };
  }

  const record = payload as UnknownRecord;
  const email = getString(record, "email").trim().toLowerCase();
  const password = getString(record, "password");

  if (email.length === 0 || password.length === 0) {
    return { ok: false as const, error: "Введіть email та пароль" };
  }

  return {
    ok: true as const,
    data: {
      email,
      password,
    },
  };
}

export function validateRegistrationPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { ok: false as const, error: "Заповніть усі поля" };
  }

  const record = payload as UnknownRecord;
  const firstName = getString(record, "firstName").trim();
  const lastName = getString(record, "lastName").trim();
  const email = getString(record, "email").trim().toLowerCase();
  const phone = normalizePhone(getString(record, "phone"));
  const password = getString(record, "password");
  const confirmPassword = getString(record, "confirmPassword");

  if (
    firstName.length === 0 ||
    lastName.length === 0 ||
    email.length === 0 ||
    phone.length === 0 ||
    password.length === 0 ||
    confirmPassword.length === 0
  ) {
    return { ok: false as const, error: "Заповніть усі поля" };
  }

  if (!isValidName(firstName) || !isValidName(lastName)) {
    return {
      ok: false as const,
      error: "Ім'я та прізвище можуть містити лише літери, пробіл, апостроф або дефіс",
    };
  }

  if (!isValidEmail(email)) {
    return { ok: false as const, error: "Вкажіть коректний email" };
  }

  if (!PHONE_PATTERN.test(phone)) {
    return { ok: false as const, error: "Вкажіть коректний номер телефону" };
  }

  if (!isStrongPassword(password)) {
    return {
      ok: false as const,
      error: "Пароль має містити щонайменше 8 символів, літери та цифри",
    };
  }

  if (password !== confirmPassword) {
    return { ok: false as const, error: "Паролі не співпадають" };
  }

  return {
    ok: true as const,
    data: {
      firstName,
      lastName,
      email,
      phone,
      password,
    },
  };
}

export function validateProfileUpdatePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { ok: false as const, error: "Ім'я та прізвище обов'язкові" };
  }

  const record = payload as UnknownRecord;
  const firstName = getString(record, "firstName").trim();
  const lastName = getString(record, "lastName").trim();
  const phone = normalizePhone(getString(record, "phone"));

  if (firstName.length === 0 || lastName.length === 0) {
    return { ok: false as const, error: "Ім'я та прізвище обов'язкові" };
  }

  if (!isValidName(firstName) || !isValidName(lastName)) {
    return {
      ok: false as const,
      error: "Ім'я та прізвище: тільки літери, пробіл, апостроф або дефіс",
    };
  }

  if (phone.length === 0) {
    return { ok: false as const, error: "Телефон обов'язковий" };
  }

  if (!PHONE_PATTERN.test(phone)) {
    return {
      ok: false as const,
      error: "Невірний формат телефону. Приклад: +380XXXXXXXXX",
    };
  }

  return {
    ok: true as const,
    data: {
      firstName,
      lastName,
      phone,
    },
  };
}

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
