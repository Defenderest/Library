export type TrackingStageKey = "created" | "confirmed" | "processing" | "shipped" | "delivered";

export type DerivedStageKey = TrackingStageKey | "canceled" | "unknown";

export type OrderTrackingStage = {
  key: TrackingStageKey;
  label: string;
  reached: boolean;
  active: boolean;
  reachedAt: string | null;
};

export type OrderTrackingSummary = {
  currentStageKey: DerivedStageKey;
  currentStageLabel: string;
  progressPercent: number;
  isCanceled: boolean;
  statusMessage: string;
  etaMessage: string;
  trackingNumber: string;
};

export type OrderStatusEvent = {
  orderStatusId: number;
  status: string;
  statusDate: string;
  trackingNumber: string;
  stageKey: DerivedStageKey;
};

export type PurchasedOrderItem = {
  orderItemId: number;
  bookId: number;
  title: string;
  authors: string;
  coverImagePath: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
};

export type OrderHistoryEntry = {
  orderId: number;
  orderDate: string;
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: string;
  itemCount: number;
  statusCount: number;
  currentStatus: string;
  currentStatusDate: string;
  items: PurchasedOrderItem[];
  statuses: OrderStatusEvent[];
  trackingStages: OrderTrackingStage[];
  trackingSummary: OrderTrackingSummary;
};
