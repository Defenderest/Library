import { createHash, randomUUID } from "crypto";

import type { Prisma, PrismaClient } from "@prisma/client";

import { execute, queryFirst, queryRows } from "@/lib/db/raw";
import { prisma } from "@/lib/prisma";

const LIQPAY_CHECKOUT_URL = "https://www.liqpay.ua/api/3/checkout";
const LIQPAY_API_URL = "https://www.liqpay.ua/api/request";
const LIQPAY_PROVIDER = "liqpay";
const LIQPAY_CURRENCY = "UAH";
const RESERVATION_HOLD_MINUTES = 15;

const RESERVATION_PENDING = "pending";
const RESERVATION_COMPLETED = "completed";
const RESERVATION_CANCELED = "canceled";
const RESERVATION_EXPIRED = "expired";

type RawExecutor = PrismaClient | Prisma.TransactionClient;

type CheckoutCartRow = {
  bookId: number;
  quantity: number;
  title: string;
  price: number | string | null;
};

type CreatedReservationRow = {
  reservationId: number;
};

type PaymentTransactionRow = {
  paymentTransactionId: number;
  provider: string;
  providerOrderId: string;
  customerId: number;
  orderId: number | null;
  amount: number | string;
  currency: string;
  status: string;
};

type ReservationRow = {
  reservationId: number;
  customerId: number;
  providerOrderId: string;
  orderId: number | null;
  status: string;
  expiresAt: Date | string;
};

type ReservationItemRow = {
  reservationItemId: number;
  reservationId: number;
  bookId: number;
  quantity: number;
  title: string;
  price: number | string | null;
};

type CheckoutContextRow = {
  details: string | null;
};

type CreatedOrderRow = {
  orderId: number;
};

type LiqPayConfig = {
  publicKey: string;
  privateKey: string;
  baseUrl: string;
  sandboxMode: boolean;
};

type LiqPayStatusResponse = {
  status?: string;
  payment_id?: string | number;
  [key: string]: unknown;
};

type CheckoutContext = {
  shippingAddress: string;
  items: Array<{
    bookId: number;
    quantity: number;
    price: number;
  }>;
};

type ProcessStatusInput = {
  providerOrderId: string;
  providerStatus: string;
  providerPaymentId: string | null;
  responseDataBase64: string | null;
  responseSignature: string | null;
  verified: boolean;
  providerPayload: unknown;
  expectedCustomerId?: number;
};

type LiqPayCheckoutStartResult = {
  providerOrderId: string;
  totalAmount: number;
  expiresAt: string;
  checkoutUrl: string;
  data: string;
  signature: string;
};

type LiqPayProcessResult = {
  state: "success" | "pending" | "failed" | "canceled" | "expired";
  message: string;
  orderId?: number;
};

class LiqPayServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function toMoney(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

function normalizeStatus(status: string | null | undefined): string {
  return String(status ?? "").trim().toLowerCase();
}

function isSuccessStatus(status: string): boolean {
  return status === "success" || status === "sandbox";
}

function isFailureStatus(status: string): boolean {
  return status === "failure" || status === "error" || status === "reversed";
}

function isCanceledStatus(status: string): boolean {
  return status === "canceled";
}

function isPendingStatus(status: string): boolean {
  return (
    status === "pending" ||
    status === "wait_accept" ||
    status === "wait_secure" ||
    status === "processing"
  );
}

function serializeDetails(value: unknown): string {
  return JSON.stringify(value);
}

function createSignature(privateKey: string, data: string): string {
  const sha1 = createHash("sha1");
  sha1.update(privateKey + data + privateKey);
  return sha1.digest("base64");
}

function encodePayload(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function decodePayload<T>(dataBase64: string): T {
  const json = Buffer.from(dataBase64, "base64").toString("utf8");
  return JSON.parse(json) as T;
}

function getBaseUrl(): string {
  const direct = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (direct && direct.trim().length > 0) {
    return direct.trim().replace(/\/$/, "");
  }

  const productionVercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionVercelUrl && productionVercelUrl.trim().length > 0) {
    return `https://${productionVercelUrl.trim().replace(/\/$/, "")}`;
  }

  const branchVercelUrl = process.env.VERCEL_BRANCH_URL;
  if (branchVercelUrl && branchVercelUrl.trim().length > 0) {
    return `https://${branchVercelUrl.trim().replace(/\/$/, "")}`;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim().length > 0) {
    return `https://${vercelUrl.trim().replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

function isSandboxMode(): boolean {
  const rawValue = process.env.LIQPAY_SANDBOX_MODE?.trim().toLowerCase();

  if (!rawValue) {
    return true;
  }

  return rawValue === "1" || rawValue === "true" || rawValue === "yes";
}

function getLiqPayConfig(): LiqPayConfig {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY?.trim() ?? "";
  const privateKey = process.env.LIQPAY_PRIVATE_KEY?.trim() ?? "";

  if (publicKey.length === 0 || privateKey.length === 0) {
    throw new LiqPayServiceError("LiqPay не налаштовано на сервері", 500);
  }

  return {
    publicKey,
    privateKey,
    baseUrl: getBaseUrl(),
    sandboxMode: isSandboxMode(),
  };
}

function buildProviderOrderId(customerId: number): string {
  const compactUuid = randomUUID().replace(/-/g, "").slice(0, 12);
  return `LP-${customerId}-${Date.now()}-${compactUuid}`;
}

function parseCheckoutContext(details: string | null | undefined): CheckoutContext | null {
  if (!details) {
    return null;
  }

  let parsed: Partial<CheckoutContext>;

  try {
    parsed = JSON.parse(details) as Partial<CheckoutContext>;
  } catch {
    return null;
  }

  if (!parsed || typeof parsed.shippingAddress !== "string" || !Array.isArray(parsed.items)) {
    return null;
  }

  return {
    shippingAddress: parsed.shippingAddress,
    items: parsed.items
      .filter((item) => item && Number.isInteger(item.bookId) && Number.isInteger(item.quantity))
      .map((item) => ({
        bookId: Number(item.bookId),
        quantity: Number(item.quantity),
        price: Number(item.price ?? 0),
      })),
  };
}

function createCheckoutPayload(
  config: LiqPayConfig,
  providerOrderId: string,
  totalAmount: number,
  expiresAt: Date,
): { data: string; signature: string; checkoutUrl: string } {
  const payload = {
    version: "3",
    public_key: config.publicKey,
    action: "pay",
    amount: totalAmount.toFixed(2),
    currency: LIQPAY_CURRENCY,
    description: `Оплата замовлення ${providerOrderId}`,
    order_id: providerOrderId,
    language: "uk",
    result_url: `${config.baseUrl}/cart?liqpay=return&providerOrderId=${providerOrderId}`,
    server_url: `${config.baseUrl}/api/checkout/liqpay/callback`,
    info: JSON.stringify({
      holdExpiresAt: expiresAt.toISOString(),
    }),
  };

  if (config.sandboxMode) {
    Object.assign(payload, { sandbox: "1" });
  }

  const data = encodePayload(payload);
  const signature = createSignature(config.privateKey, data);
  const checkoutUrl = `${LIQPAY_CHECKOUT_URL}?data=${encodeURIComponent(data)}&signature=${encodeURIComponent(signature)}`;

  return {
    data,
    signature,
    checkoutUrl,
  };
}

async function appendPaymentStatus(
  tx: RawExecutor,
  paymentTransactionId: number,
  status: string,
  details: unknown,
) {
  await execute(tx, "liqpay/create_payment_status_history", [
    paymentTransactionId,
    status,
    serializeDetails(details),
  ]);
}

async function releaseReservationStockById(tx: RawExecutor, reservationId: number) {
  const reservationItems = await queryRows<ReservationItemRow>(tx, "liqpay/get_book_reservation_items", [
    reservationId,
  ]);

  for (const item of reservationItems) {
    await execute(tx, "liqpay/release_reserved_book_stock", [item.bookId, item.quantity]);
  }
}

async function cleanupExpiredReservationsTx(tx: RawExecutor): Promise<void> {
  const expiredReservations = await queryRows<ReservationRow>(
    tx,
    "liqpay/get_expired_book_reservations_for_update",
    [],
  );

  for (const reservation of expiredReservations) {
    await releaseReservationStockById(tx, reservation.reservationId);
    await execute(tx, "liqpay/mark_book_reservation_status", [
      reservation.providerOrderId,
      RESERVATION_EXPIRED,
    ]);

    const payment = await queryFirst<PaymentTransactionRow>(
      tx,
      "liqpay/get_payment_transaction_for_update",
      [reservation.providerOrderId],
    );

    if (!payment) {
      continue;
    }

    await queryFirst(tx, "liqpay/update_payment_transaction_status", [
      reservation.providerOrderId,
      RESERVATION_EXPIRED,
      null,
      null,
      null,
      false,
    ]);

    await appendPaymentStatus(tx, payment.paymentTransactionId, RESERVATION_EXPIRED, {
      reason: "reservation_expired",
      providerOrderId: reservation.providerOrderId,
    });
  }
}

async function cancelCustomerPendingReservationsTx(
  tx: RawExecutor,
  customerId: number,
): Promise<void> {
  const pendingReservations = await queryRows<ReservationRow>(
    tx,
    "liqpay/get_customer_pending_reservations_for_update",
    [customerId],
  );

  for (const reservation of pendingReservations) {
    await releaseReservationStockById(tx, reservation.reservationId);
    await execute(tx, "liqpay/mark_book_reservation_status", [
      reservation.providerOrderId,
      RESERVATION_CANCELED,
    ]);

    const payment = await queryFirst<PaymentTransactionRow>(
      tx,
      "liqpay/get_payment_transaction_for_update",
      [reservation.providerOrderId],
    );

    if (!payment) {
      continue;
    }

    await queryFirst(tx, "liqpay/update_payment_transaction_status", [
      reservation.providerOrderId,
      RESERVATION_CANCELED,
      null,
      null,
      null,
      true,
    ]);

    await appendPaymentStatus(tx, payment.paymentTransactionId, RESERVATION_CANCELED, {
      reason: "replaced_by_new_checkout",
      providerOrderId: reservation.providerOrderId,
    });
  }
}

async function fetchLiqPayStatus(
  config: LiqPayConfig,
  providerOrderId: string,
): Promise<{
  providerStatus: string;
  providerPaymentId: string | null;
  responseDataBase64: string;
  providerPayload: LiqPayStatusResponse;
}> {
  const requestPayload = {
    action: "status",
    version: "3",
    public_key: config.publicKey,
    order_id: providerOrderId,
  };

  const data = encodePayload(requestPayload);
  const signature = createSignature(config.privateKey, data);

  const response = await fetch(LIQPAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ data, signature }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new LiqPayServiceError("Не вдалося перевірити платіж у LiqPay", 502);
  }

  const payload = (await response.json()) as LiqPayStatusResponse;
  const normalizedStatus = normalizeStatus(payload.status);
  if (normalizedStatus.length === 0) {
    throw new LiqPayServiceError("LiqPay повернув некоректну відповідь", 502);
  }

  return {
    providerStatus: normalizedStatus,
    providerPaymentId:
      payload.payment_id === undefined || payload.payment_id === null
        ? null
        : String(payload.payment_id),
    responseDataBase64: Buffer.from(JSON.stringify(payload), "utf8").toString("base64"),
    providerPayload: payload,
  };
}

async function finalizeSuccessfulPaymentTx(
  tx: RawExecutor,
  payment: PaymentTransactionRow,
  reservation: ReservationRow,
): Promise<LiqPayProcessResult> {
  if (payment.orderId) {
    return {
      state: "success",
      orderId: payment.orderId,
      message: `Замовлення #${payment.orderId} успішно оформлено`,
    };
  }

  const reservationItems = await queryRows<ReservationItemRow>(tx, "liqpay/get_book_reservation_items", [
    reservation.reservationId,
  ]);

  if (reservationItems.length === 0) {
    throw new LiqPayServiceError("Не знайдено товари в бронюванні", 409);
  }

  const checkoutContextRow = await queryFirst<CheckoutContextRow>(tx, "liqpay/get_payment_checkout_context", [
    payment.paymentTransactionId,
  ]);

  const checkoutContext = parseCheckoutContext(checkoutContextRow?.details);
  if (!checkoutContext || checkoutContext.shippingAddress.trim().length === 0) {
    throw new LiqPayServiceError("Не вдалося відновити адресу доставки", 409);
  }

  const priceByBookId = new Map<number, number>();
  for (const item of checkoutContext.items) {
    priceByBookId.set(item.bookId, Number(item.price ?? 0));
  }

  let totalAmount = 0;
  for (const item of reservationItems) {
    const itemPrice = Number((priceByBookId.get(item.bookId) ?? toMoney(item.price)).toFixed(2));
    totalAmount += itemPrice * item.quantity;
  }

  const normalizedTotalAmount = Number(totalAmount.toFixed(2));
  const order = await queryFirst<CreatedOrderRow>(tx, "cart/create_order", [
    reservation.customerId,
    normalizedTotalAmount,
    checkoutContext.shippingAddress,
    "LiqPay Sandbox",
  ]);

  if (!order) {
    throw new LiqPayServiceError("Не вдалося створити замовлення", 500);
  }

  for (const item of reservationItems) {
    const itemPrice = Number((priceByBookId.get(item.bookId) ?? toMoney(item.price)).toFixed(2));
    await execute(tx, "cart/create_order_item", [order.orderId, item.bookId, item.quantity, itemPrice]);
  }

  await execute(tx, "cart/create_order_status", [order.orderId, "Створено"]);
  await execute(tx, "liqpay/mark_book_reservation_completed", [
    reservation.providerOrderId,
    RESERVATION_COMPLETED,
    order.orderId,
  ]);
  await execute(tx, "liqpay/link_payment_transaction_to_order", [reservation.providerOrderId, order.orderId]);
  await execute(tx, "cart/clear_cart", [reservation.customerId]);

  return {
    state: "success",
    orderId: order.orderId,
    message: `Замовлення #${order.orderId} успішно оформлено`,
  };
}

async function cancelOrExpireReservationTx(
  tx: RawExecutor,
  reservation: ReservationRow,
  targetStatus: typeof RESERVATION_CANCELED | typeof RESERVATION_EXPIRED,
): Promise<LiqPayProcessResult> {
  if (reservation.status === RESERVATION_COMPLETED) {
    return {
      state: "success",
      orderId: reservation.orderId ?? undefined,
      message: reservation.orderId
        ? `Замовлення #${reservation.orderId} успішно оформлено`
        : "Платіж уже підтверджено",
    };
  }

  if (reservation.status === RESERVATION_CANCELED) {
    return {
      state: "canceled",
      message: "Платіж скасовано, бронювання знято",
    };
  }

  if (reservation.status === RESERVATION_EXPIRED) {
    return {
      state: "expired",
      message: "Час бронювання минув, спробуйте оформити замовлення ще раз",
    };
  }

  await releaseReservationStockById(tx, reservation.reservationId);
  await execute(tx, "liqpay/mark_book_reservation_status", [reservation.providerOrderId, targetStatus]);

  if (targetStatus === RESERVATION_EXPIRED) {
    return {
      state: "expired",
      message: "Час бронювання минув, спробуйте оформити замовлення ще раз",
    };
  }

  return {
    state: "canceled",
    message: "Платіж скасовано, бронювання знято",
  };
}

async function processPaymentStatusTx(tx: RawExecutor, input: ProcessStatusInput): Promise<LiqPayProcessResult> {
  const payment = await queryFirst<PaymentTransactionRow>(tx, "liqpay/get_payment_transaction_for_update", [
    input.providerOrderId,
  ]);

  if (!payment) {
    throw new LiqPayServiceError("Платіж не знайдено", 404);
  }

  if (input.expectedCustomerId && payment.customerId !== input.expectedCustomerId) {
    throw new LiqPayServiceError("Платіж належить іншому користувачу", 403);
  }

  const reservation = await queryFirst<ReservationRow>(tx, "liqpay/get_book_reservation_for_update", [
    input.providerOrderId,
  ]);

  if (!reservation) {
    if (payment.orderId) {
      return {
        state: "success",
        orderId: payment.orderId,
        message: `Замовлення #${payment.orderId} успішно оформлено`,
      };
    }

    throw new LiqPayServiceError("Бронювання не знайдено", 404);
  }

  const normalizedStatus = normalizeStatus(input.providerStatus);
  if (normalizedStatus.length === 0) {
    throw new LiqPayServiceError("Отримано некоректний статус платежу", 400);
  }

  await queryFirst(tx, "liqpay/update_payment_transaction_status", [
    input.providerOrderId,
    normalizedStatus,
    input.responseDataBase64,
    input.responseSignature,
    input.providerPaymentId,
    input.verified,
  ]);

  await appendPaymentStatus(tx, payment.paymentTransactionId, normalizedStatus, {
    providerOrderId: input.providerOrderId,
    providerStatus: normalizedStatus,
    providerPayload: input.providerPayload,
  });

  if (reservation.status === RESERVATION_COMPLETED) {
    return {
      state: "success",
      orderId: reservation.orderId ?? payment.orderId ?? undefined,
      message:
        reservation.orderId || payment.orderId
          ? `Замовлення #${reservation.orderId ?? payment.orderId} успішно оформлено`
          : "Платіж уже підтверджено",
    };
  }

  if (reservation.status === RESERVATION_CANCELED) {
    return {
      state: "canceled",
      message: "Платіж скасовано, бронювання вже знято",
    };
  }

  if (reservation.status === RESERVATION_EXPIRED) {
    return {
      state: "expired",
      message: "Час бронювання минув, спробуйте оформити замовлення ще раз",
    };
  }

  if (isSuccessStatus(normalizedStatus)) {
    return finalizeSuccessfulPaymentTx(tx, payment, reservation);
  }

  if (isFailureStatus(normalizedStatus) || isCanceledStatus(normalizedStatus)) {
    return cancelOrExpireReservationTx(tx, reservation, RESERVATION_CANCELED);
  }

  const expiresAtTimestamp = new Date(reservation.expiresAt).getTime();
  if (Number.isFinite(expiresAtTimestamp) && expiresAtTimestamp <= Date.now()) {
    return cancelOrExpireReservationTx(tx, reservation, RESERVATION_EXPIRED);
  }

  if (isPendingStatus(normalizedStatus)) {
    return {
      state: "pending",
      message: "Платіж ще обробляється LiqPay",
    };
  }

  return {
    state: "pending",
    message: "Очікуємо фінальне підтвердження платежу",
  };
}

function parseProviderOrderId(value: unknown): string {
  const providerOrderId = typeof value === "string" ? value.trim() : "";
  if (providerOrderId.length === 0 || providerOrderId.length > 128) {
    throw new LiqPayServiceError("Некоректний ідентифікатор платежу", 400);
  }

  return providerOrderId;
}

export async function startLiqPayCheckoutFromCart(
  customerId: number,
  shippingAddress: string,
): Promise<LiqPayCheckoutStartResult> {
  const config = getLiqPayConfig();

  return prisma.$transaction(async (tx) => {
    await cleanupExpiredReservationsTx(tx);
    await cancelCustomerPendingReservationsTx(tx, customerId);

    const cartRows = await queryRows<CheckoutCartRow>(tx, "cart/get_checkout_cart_rows", [customerId]);

    if (cartRows.length === 0) {
      throw new LiqPayServiceError("Кошик порожній", 409);
    }

    const providerOrderId = buildProviderOrderId(customerId);
    const expiresAt = new Date(Date.now() + RESERVATION_HOLD_MINUTES * 60 * 1000);

    const reservation = await queryFirst<CreatedReservationRow>(tx, "liqpay/create_book_reservation", [
      customerId,
      providerOrderId,
      RESERVATION_PENDING,
      expiresAt,
    ]);

    if (!reservation) {
      throw new LiqPayServiceError("Не вдалося створити бронювання", 500);
    }

    let totalAmount = 0;

    for (const row of cartRows) {
      if (row.quantity <= 0) {
        throw new LiqPayServiceError("Кошик містить некоректну кількість товару", 409);
      }

      const updatedStock = await queryFirst<{ bookId: number }>(tx, "cart/decrement_book_stock", [
        row.bookId,
        row.quantity,
      ]);

      if (!updatedStock) {
        throw new LiqPayServiceError(`Книга \"${row.title}\" вже недоступна у потрібній кількості`, 409);
      }

      await execute(tx, "liqpay/create_book_reservation_item", [
        reservation.reservationId,
        row.bookId,
        row.quantity,
      ]);

      totalAmount += toMoney(row.price) * row.quantity;
    }

    const normalizedTotalAmount = Number(totalAmount.toFixed(2));
    const { data, signature, checkoutUrl } = createCheckoutPayload(
      config,
      providerOrderId,
      normalizedTotalAmount,
      expiresAt,
    );

    const payment = await queryFirst<{ paymentTransactionId: number }>(
      tx,
      "liqpay/create_payment_transaction",
      [
        LIQPAY_PROVIDER,
        providerOrderId,
        customerId,
        normalizedTotalAmount,
        LIQPAY_CURRENCY,
        "pending",
        checkoutUrl,
        data,
        signature,
      ],
    );

    if (!payment) {
      throw new LiqPayServiceError("Не вдалося створити платіж", 500);
    }

    const checkoutContext: CheckoutContext = {
      shippingAddress,
      items: cartRows.map((row) => ({
        bookId: row.bookId,
        quantity: row.quantity,
        price: Number(toMoney(row.price).toFixed(2)),
      })),
    };

    await appendPaymentStatus(tx, payment.paymentTransactionId, "checkout_started", checkoutContext);

    return {
      providerOrderId,
      totalAmount: normalizedTotalAmount,
      expiresAt: expiresAt.toISOString(),
      checkoutUrl,
      data,
      signature,
    };
  });
}

export async function verifyLiqPayPayment(
  customerId: number,
  providerOrderIdInput: unknown,
): Promise<LiqPayProcessResult> {
  const providerOrderId = parseProviderOrderId(providerOrderIdInput);
  const config = getLiqPayConfig();
  const providerStatus = await fetchLiqPayStatus(config, providerOrderId);

  return prisma.$transaction(async (tx) => {
    await cleanupExpiredReservationsTx(tx);
    return processPaymentStatusTx(tx, {
      providerOrderId,
      providerStatus: providerStatus.providerStatus,
      providerPaymentId: providerStatus.providerPaymentId,
      responseDataBase64: providerStatus.responseDataBase64,
      responseSignature: null,
      verified: true,
      providerPayload: providerStatus.providerPayload,
      expectedCustomerId: customerId,
    });
  });
}

export async function cancelLiqPayPayment(
  customerId: number,
  providerOrderIdInput: unknown,
): Promise<LiqPayProcessResult> {
  const providerOrderId = parseProviderOrderId(providerOrderIdInput);

  return prisma.$transaction(async (tx) => {
    await cleanupExpiredReservationsTx(tx);

    const result = await processPaymentStatusTx(tx, {
      providerOrderId,
      providerStatus: RESERVATION_CANCELED,
      providerPaymentId: null,
      responseDataBase64: null,
      responseSignature: null,
      verified: true,
      providerPayload: {
        source: "manual_cancel",
      },
      expectedCustomerId: customerId,
    });

    return result;
  });
}

export async function processLiqPayCallback(dataBase64: unknown, signature: unknown): Promise<LiqPayProcessResult> {
  const data = typeof dataBase64 === "string" ? dataBase64.trim() : "";
  const responseSignature = typeof signature === "string" ? signature.trim() : "";

  if (data.length === 0 || responseSignature.length === 0) {
    throw new LiqPayServiceError("Некоректні дані callback", 400);
  }

  const config = getLiqPayConfig();
  const expectedSignature = createSignature(config.privateKey, data);
  if (responseSignature !== expectedSignature) {
    throw new LiqPayServiceError("Невірний підпис LiqPay callback", 400);
  }

  const payload = decodePayload<LiqPayStatusResponse>(data);
  const providerOrderId = parseProviderOrderId(payload.order_id);
  const providerStatus = normalizeStatus(payload.status);
  const providerPaymentId =
    payload.payment_id === undefined || payload.payment_id === null ? null : String(payload.payment_id);

  return prisma.$transaction(async (tx) => {
    await cleanupExpiredReservationsTx(tx);
    return processPaymentStatusTx(tx, {
      providerOrderId,
      providerStatus,
      providerPaymentId,
      responseDataBase64: data,
      responseSignature,
      verified: true,
      providerPayload: payload,
    });
  });
}

export function mapLiqPayServiceError(error: unknown): { status: number; message: string } {
  if (error instanceof LiqPayServiceError) {
    return {
      status: error.status,
      message: error.message,
    };
  }

  console.error("LiqPay service error:", error);
  return {
    status: 500,
    message: "Внутрішня помилка сервера",
  };
}
