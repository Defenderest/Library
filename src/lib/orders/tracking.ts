import type {
  DerivedStageKey,
  OrderStatusEvent,
  OrderTrackingStage,
  OrderTrackingSummary,
  TrackingStageKey,
} from "@/lib/orders/types";

const TRACKING_STAGES: Array<{ key: TrackingStageKey; label: string }> = [
  { key: "created", label: "Створено" },
  { key: "confirmed", label: "Підтверджено" },
  { key: "processing", label: "Комплектація" },
  { key: "shipped", label: "В дорозі" },
  { key: "delivered", label: "Доставлено" },
];

function normalizeStatus(value: string): string {
  return value.trim().toLowerCase();
}

function hasAnyToken(value: string, tokens: string[]): boolean {
  return tokens.some((token) => value.includes(token));
}

export function mapStatusToStage(status: string): DerivedStageKey {
  const normalized = normalizeStatus(status);

  if (hasAnyToken(normalized, ["скас", "cancel", "відхил"])) {
    return "canceled";
  }

  if (hasAnyToken(normalized, ["достав", "вруч", "delivered"])) {
    return "delivered";
  }

  if (
    hasAnyToken(normalized, [
      "передано до служби доставки",
      "передано в достав",
      "надіслан",
      "відправ",
      "дороз",
      "shipped",
    ])
  ) {
    return "shipped";
  }

  if (hasAnyToken(normalized, ["оброб", "комплект", "processing"])) {
    return "processing";
  }

  if (hasAnyToken(normalized, ["очікує підтвердж", "підтвердж", "оплач", "confirm", "paid"])) {
    return "confirmed";
  }

  if (hasAnyToken(normalized, ["створ", "нове", "created", "new"])) {
    return "created";
  }

  return "unknown";
}

function getStageIndex(stageKey: TrackingStageKey): number {
  return TRACKING_STAGES.findIndex((stage) => stage.key === stageKey);
}

function isTrackingStageKey(value: DerivedStageKey): value is TrackingStageKey {
  return TRACKING_STAGES.some((stage) => stage.key === value);
}

function resolveTrackingMessage(stageKey: DerivedStageKey, isCanceled: boolean): string {
  if (isCanceled) {
    return "Замовлення скасовано. Доставку зупинено.";
  }

  if (stageKey === "delivered") {
    return "Замовлення успішно доставлено.";
  }

  if (stageKey === "shipped") {
    return "Замовлення передано службі доставки.";
  }

  if (stageKey === "processing") {
    return "Замовлення комплектується на складі.";
  }

  if (stageKey === "confirmed") {
    return "Замовлення підтверджено та готується до відправлення.";
  }

  return "Замовлення створено та очікує підтвердження.";
}

function resolveEtaMessage(stageKey: DerivedStageKey, isCanceled: boolean): string {
  if (isCanceled) {
    return "Статус доставки не формується для скасованого замовлення.";
  }

  if (stageKey === "delivered") {
    return "Дякуємо за покупку. Доставку завершено.";
  }

  if (stageKey === "shipped") {
    return "Орієнтовний термін доставки: 1-3 дні.";
  }

  if (stageKey === "processing") {
    return "Відправлення очікується після завершення комплектації.";
  }

  if (stageKey === "confirmed") {
    return "Найближчим часом замовлення перейде у комплектацію.";
  }

  return "Після підтвердження замовлення з'явиться прогноз доставки.";
}

export function deriveTracking(statuses: OrderStatusEvent[]): {
  trackingStages: OrderTrackingStage[];
  trackingSummary: OrderTrackingSummary;
} {
  const reachedAtByStage = new Map<TrackingStageKey, string>();

  for (const event of statuses) {
    if (event.stageKey === "unknown" || event.stageKey === "canceled") {
      continue;
    }

    if (!reachedAtByStage.has(event.stageKey)) {
      reachedAtByStage.set(event.stageKey, event.statusDate);
    }
  }

  let highestReachedIndex = -1;
  for (const stage of TRACKING_STAGES) {
    if (reachedAtByStage.has(stage.key)) {
      highestReachedIndex = Math.max(highestReachedIndex, getStageIndex(stage.key));
    }
  }

  const latestEvent = statuses[statuses.length - 1] ?? null;
  const latestTrackingNumberEvent = [...statuses]
    .reverse()
    .find((event) => event.trackingNumber.trim().length > 0);

  const latestStageKey: DerivedStageKey = latestEvent?.stageKey ?? "created";
  const isCanceled = latestStageKey === "canceled";

  let currentStageKey: DerivedStageKey = "created";

  if (isCanceled) {
    currentStageKey = "canceled";
  } else if (latestStageKey !== "unknown") {
    currentStageKey = latestStageKey;
  } else if (highestReachedIndex >= 0) {
    currentStageKey = TRACKING_STAGES[highestReachedIndex].key;
  }

  const currentStageIndex = isTrackingStageKey(currentStageKey)
    ? getStageIndex(currentStageKey)
    : highestReachedIndex;

  const normalizedProgressIndex = Math.max(currentStageIndex, 0);
  const progressPercent = Math.round(((normalizedProgressIndex + 1) / TRACKING_STAGES.length) * 100);

  const trackingStages = TRACKING_STAGES.map((stage) => {
    const reachedAt = reachedAtByStage.get(stage.key) ?? null;
    const reached = Boolean(reachedAt);
    const active = !isCanceled && stage.key === currentStageKey;

    return {
      key: stage.key,
      label: stage.label,
      reached,
      active,
      reachedAt,
    };
  });

  const currentStageLabel =
    currentStageKey === "canceled"
      ? "Скасовано"
      : TRACKING_STAGES.find((stage) => stage.key === currentStageKey)?.label ?? "Створено";

  const trackingSummary: OrderTrackingSummary = {
    currentStageKey,
    currentStageLabel,
    progressPercent: Math.max(8, Math.min(progressPercent, 100)),
    isCanceled,
    statusMessage: resolveTrackingMessage(currentStageKey, isCanceled),
    etaMessage: resolveEtaMessage(currentStageKey, isCanceled),
    trackingNumber: latestTrackingNumberEvent?.trackingNumber ?? "",
  };

  return {
    trackingStages,
    trackingSummary,
  };
}
