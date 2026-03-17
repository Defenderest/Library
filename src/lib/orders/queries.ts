import { queryRows } from "@/lib/db/raw";
import { prisma } from "@/lib/prisma";
import { deriveTracking, mapStatusToStage } from "@/lib/orders/tracking";
import type { OrderHistoryEntry, OrderStatusEvent, PurchasedOrderItem } from "@/lib/orders/types";

type OrderSummaryRow = {
  orderId: number;
  orderDate: Date | string;
  totalAmount: number | string | null;
  paymentMethod: string | null;
  shippingAddress: string;
  itemCount: number | null;
  statusCount: number | null;
  currentStatus: string | null;
  currentStatusDate: Date | string | null;
};

type OrderStatusRow = {
  orderId: number;
  orderStatusId: number;
  status: string;
  statusDate: Date | string;
  trackingNumber: string | null;
};

type OrderItemRow = {
  orderId: number;
  orderItemId: number;
  bookId: number;
  quantity: number;
  pricePerUnit: number | string;
  title: string;
  authors: string | null;
  coverImagePath: string | null;
};

function asString(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function asNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

function asInt(value: number | null | undefined): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function toIsoString(value: Date | string | null | undefined): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value !== "string") {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function groupStatuses(rows: OrderStatusRow[]): Map<number, OrderStatusEvent[]> {
  const statusesByOrder = new Map<number, OrderStatusEvent[]>();

  for (const row of rows) {
    const event: OrderStatusEvent = {
      orderStatusId: row.orderStatusId,
      status: asString(row.status) || "Нове",
      statusDate: toIsoString(row.statusDate),
      trackingNumber: asString(row.trackingNumber),
      stageKey: mapStatusToStage(row.status),
    };

    const existing = statusesByOrder.get(row.orderId) ?? [];
    existing.push(event);
    statusesByOrder.set(row.orderId, existing);
  }

  return statusesByOrder;
}

function groupItems(rows: OrderItemRow[]): Map<number, PurchasedOrderItem[]> {
  const itemsByOrder = new Map<number, PurchasedOrderItem[]>();

  for (const row of rows) {
    const pricePerUnit = Number(asNumber(row.pricePerUnit).toFixed(2));

    const item: PurchasedOrderItem = {
      orderItemId: row.orderItemId,
      bookId: row.bookId,
      title: row.title,
      authors: asString(row.authors) || "Невідомий автор",
      coverImagePath: asString(row.coverImagePath),
      quantity: asInt(row.quantity),
      pricePerUnit,
      subtotal: Number((pricePerUnit * asInt(row.quantity)).toFixed(2)),
    };

    const existing = itemsByOrder.get(row.orderId) ?? [];
    existing.push(item);
    itemsByOrder.set(row.orderId, existing);
  }

  return itemsByOrder;
}

export async function getCustomerOrderHistory(customerId: number): Promise<OrderHistoryEntry[]> {
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return [];
  }

  try {
    const [ordersRows, statusRows, itemRows] = await Promise.all([
      queryRows<OrderSummaryRow>(prisma, "orders/get_customer_orders_list", [customerId]),
      queryRows<OrderStatusRow>(prisma, "orders/get_customer_order_status_history", [customerId]),
      queryRows<OrderItemRow>(prisma, "orders/get_customer_order_items", [customerId]),
    ]);

    const statusesByOrder = groupStatuses(statusRows);
    const itemsByOrder = groupItems(itemRows);

    return ordersRows.map((row) => {
      const statuses = statusesByOrder.get(row.orderId) ?? [];
      const items = itemsByOrder.get(row.orderId) ?? [];
      const latestStatus = statuses[statuses.length - 1] ?? null;

      const { trackingStages, trackingSummary } = deriveTracking(statuses);

      return {
        orderId: row.orderId,
        orderDate: toIsoString(row.orderDate),
        totalAmount: Number(asNumber(row.totalAmount).toFixed(2)),
        paymentMethod: asString(row.paymentMethod) || "Не вказано",
        shippingAddress: asString(row.shippingAddress),
        itemCount: Math.max(asInt(row.itemCount), items.length),
        statusCount: Math.max(asInt(row.statusCount), statuses.length),
        currentStatus: asString(row.currentStatus) || latestStatus?.status || "Нове",
        currentStatusDate: toIsoString(row.currentStatusDate || latestStatus?.statusDate || row.orderDate),
        items,
        statuses,
        trackingStages,
        trackingSummary,
      };
    });
  } catch (error) {
    console.warn("Failed to load customer orders:", error);
    return [];
  }
}
