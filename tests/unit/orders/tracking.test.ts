import { describe, expect, it } from "vitest";

import { deriveTracking, mapStatusToStage } from "@/lib/orders/tracking";
import type { OrderStatusEvent } from "@/lib/orders/types";

function statusEvent(partial: Partial<OrderStatusEvent>): OrderStatusEvent {
  return {
    orderStatusId: partial.orderStatusId ?? 1,
    status: partial.status ?? "Створено",
    statusDate: partial.statusDate ?? "2026-01-01T00:00:00.000Z",
    trackingNumber: partial.trackingNumber ?? "",
    stageKey: partial.stageKey ?? "created",
  };
}

describe("order tracking", () => {
  it("maps common status labels to tracking stages", () => {
    expect(mapStatusToStage("В дорозі")).toBe("shipped");
    expect(mapStatusToStage("Замовлення доставлено")).toBe("delivered");
    expect(mapStatusToStage("Скасовано клієнтом")).toBe("canceled");
    expect(mapStatusToStage("Невідомий статус")).toBe("unknown");
  });

  it("derives active stage and tracking number", () => {
    const result = deriveTracking([
      statusEvent({
        orderStatusId: 1,
        status: "Створено",
        stageKey: "created",
        statusDate: "2026-01-01T10:00:00.000Z",
      }),
      statusEvent({
        orderStatusId: 2,
        status: "Підтверджено",
        stageKey: "confirmed",
        statusDate: "2026-01-01T11:00:00.000Z",
      }),
      statusEvent({
        orderStatusId: 3,
        status: "В дорозі",
        stageKey: "shipped",
        statusDate: "2026-01-01T12:00:00.000Z",
        trackingNumber: "NP-123456",
      }),
    ]);

    expect(result.trackingSummary.currentStageKey).toBe("shipped");
    expect(result.trackingSummary.progressPercent).toBe(80);
    expect(result.trackingSummary.trackingNumber).toBe("NP-123456");

    const activeStage = result.trackingStages.find((stage) => stage.active);
    expect(activeStage?.key).toBe("shipped");
  });

  it("marks canceled orders in summary", () => {
    const result = deriveTracking([
      statusEvent({
        orderStatusId: 10,
        status: "Скасовано",
        stageKey: "canceled",
        statusDate: "2026-01-01T13:00:00.000Z",
      }),
    ]);

    expect(result.trackingSummary.isCanceled).toBe(true);
    expect(result.trackingSummary.currentStageKey).toBe("canceled");
    expect(result.trackingSummary.currentStageLabel).toBe("Скасовано");
    expect(result.trackingSummary.statusMessage).toContain("скасовано");
  });
});
