import { z } from "zod";

const CITY_ALLOWED_PATTERN = /^[\p{L}\s'’\-.]+$/u;
const STREET_ALLOWED_PATTERN = /^[0-9\p{L}\s'’"\-.,\/()]+$/u;
const HOUSE_ALLOWED_PATTERN = /^[0-9\p{L}\-\/]+$/u;
const SHIPPING_ALLOWED_PATTERN = /^[0-9A-Za-zА-Яа-яІіЇїЄєҐґ\s\.,'"\-\/()]+$/;

export const PAYMENT_METHOD_OPTIONS = ["Готівка", "LiqPay"] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD_OPTIONS)[number];

type UnknownRecord = Record<string, unknown>;

function getString(record: UnknownRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateCity(value: string): string {
  const city = normalizeText(value);

  if (city.length === 0) {
    return "Вкажіть місто";
  }

  if (city.length < 2) {
    return "Назва міста занадто коротка";
  }

  if (city.length > 80) {
    return "Назва міста занадто довга";
  }

  if (!/[\p{L}]/u.test(city)) {
    return "Вкажіть коректне місто";
  }

  if (!CITY_ALLOWED_PATTERN.test(city)) {
    return "Вкажіть коректне місто";
  }

  return "";
}

export function validateStreet(value: string): string {
  const street = normalizeText(value);

  if (street.length === 0) {
    return "Вкажіть вулицю";
  }

  if (street.length < 2) {
    return "Назва вулиці занадто коротка";
  }

  if (street.length > 120) {
    return "Назва вулиці занадто довга";
  }

  if (!/[\p{L}]/u.test(street)) {
    return "Вулиця має містити назву";
  }

  if (!STREET_ALLOWED_PATTERN.test(street)) {
    return "Вкажіть коректну вулицю";
  }

  return "";
}

export function validateHouse(value: string): string {
  const house = normalizeText(value);

  if (house.length === 0) {
    return "Вкажіть номер будинку";
  }

  if (house.length > 20) {
    return "Номер будинку занадто довгий";
  }

  if (!/\d/.test(house)) {
    return "Вкажіть коректний номер будинку";
  }

  if (!HOUSE_ALLOWED_PATTERN.test(house)) {
    return "Вкажіть коректний номер будинку";
  }

  return "";
}

export function composeShippingAddress(city: string, street: string, house: string): string {
  return `${normalizeText(city)}, ${normalizeText(street)}, ${normalizeText(house)}`;
}

export function validateShippingAddress(value: string): string {
  const address = normalizeText(value);

  if (address.length === 0) {
    return "Вкажіть адресу доставки";
  }

  if (address.length < 8) {
    return "Адреса занадто коротка";
  }

  if (address.length > 180) {
    return "Адреса занадто довга";
  }

  if (!/[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(address)) {
    return "Адреса має містити назву вулиці";
  }

  if (!/[0-9]/.test(address)) {
    return "Вкажіть номер будинку";
  }

  if (!SHIPPING_ALLOWED_PATTERN.test(address)) {
    return "Адреса містить недопустимі символи";
  }

  return "";
}

export const checkoutFormSchema = z
  .object({
    city: z.string().trim().min(1, "Вкажіть місто"),
    street: z.string().trim().min(1, "Вкажіть вулицю"),
    house: z.string().trim().min(1, "Вкажіть номер будинку"),
    paymentMethod: z.enum(PAYMENT_METHOD_OPTIONS),
  })
  .superRefine((data, context) => {
    const cityError = validateCity(data.city);
    if (cityError.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["city"],
        message: cityError,
      });
    }

    const streetError = validateStreet(data.street);
    if (streetError.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["street"],
        message: streetError,
      });
    }

    const houseError = validateHouse(data.house);
    if (houseError.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["house"],
        message: houseError,
      });
    }

    const shippingAddress = composeShippingAddress(data.city, data.street, data.house);
    const shippingError = validateShippingAddress(shippingAddress);
    if (shippingError.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["house"],
        message: shippingError,
      });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export function validateCheckoutPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {
      ok: false as const,
      error: "Заповніть дані доставки",
    };
  }

  const record = payload as UnknownRecord;
  const city = normalizeText(getString(record, "city"));
  const street = normalizeText(getString(record, "street"));
  const house = normalizeText(getString(record, "house"));
  const paymentMethod = normalizeText(getString(record, "paymentMethod"));

  const cityError = validateCity(city);
  if (cityError.length > 0) {
    return { ok: false as const, error: cityError };
  }

  const streetError = validateStreet(street);
  if (streetError.length > 0) {
    return { ok: false as const, error: streetError };
  }

  const houseError = validateHouse(house);
  if (houseError.length > 0) {
    return { ok: false as const, error: houseError };
  }

  if (!PAYMENT_METHOD_OPTIONS.includes(paymentMethod as PaymentMethod)) {
    return { ok: false as const, error: "Оберіть спосіб оплати" };
  }

  const shippingAddress = composeShippingAddress(city, street, house);
  const shippingError = validateShippingAddress(shippingAddress);
  if (shippingError.length > 0) {
    return { ok: false as const, error: shippingError };
  }

  return {
    ok: true as const,
    data: {
      city,
      street,
      house,
      paymentMethod: paymentMethod as PaymentMethod,
      shippingAddress,
    },
  };
}
