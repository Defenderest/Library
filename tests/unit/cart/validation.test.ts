import { describe, expect, it } from "vitest";

import {
  composeShippingAddress,
  validateCheckoutPayload,
  validateCity,
  validateShippingAddress,
} from "@/lib/cart/validation";

describe("cart checkout validation", () => {
  it("builds normalized shipping address", () => {
    const address = composeShippingAddress("  Київ ", " Хрещатик   1 ", "  22-Б ");

    expect(address).toBe("Київ, Хрещатик 1, 22-Б");
  });

  it("accepts a valid checkout payload", () => {
    const result = validateCheckoutPayload({
      city: "Київ",
      street: "Володимирська",
      house: "12-А",
      paymentMethod: "Готівка",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.shippingAddress).toBe("Київ, Володимирська, 12-А");
      expect(result.data.paymentMethod).toBe("Готівка");
    }
  });

  it("rejects unknown payment method", () => {
    const result = validateCheckoutPayload({
      city: "Київ",
      street: "Володимирська",
      house: "12-А",
      paymentMethod: "Card",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Оберіть спосіб оплати");
    }
  });

  it("rejects city with invalid characters", () => {
    expect(validateCity("Kyiv123")).toBe("Вкажіть коректне місто");
  });

  it("rejects shipping address without house number", () => {
    expect(validateShippingAddress("Київ, Хрещатик")).toBe("Вкажіть номер будинку");
  });
});
