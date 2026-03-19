"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Clock3, Package, Truck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BookCover } from "@/components/books/book-cover";
import { GlassPanel } from "@/components/ui/glass-panel";
import { cn } from "@/lib/cn";
import type { OrderHistoryEntry } from "@/lib/orders/types";

type OrdersPageClientProps = {
  orders: OrderHistoryEntry[];
};

const NUMERIC_TEXT_CLASS =
  "font-body font-normal tracking-[0.008em] [font-variant-numeric:tabular-nums]";
const ORDER_ID_CLASS =
  "mt-1 inline-flex items-baseline gap-[2px] font-body text-[20px] font-medium leading-none tracking-[0.01em] text-app-primary [font-variant-numeric:tabular-nums]";

function formatMoney(value: number): string {
  return `${value.toFixed(2)} UAH`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusBadgeClass(order: OrderHistoryEntry): string {
  if (order.trackingSummary.isCanceled) {
    return "border-app-error/50 bg-app-error/10 text-app-error";
  }

  if (order.trackingSummary.currentStageKey === "delivered") {
    return "border-app-success/40 bg-app-success/10 text-app-success";
  }

  if (order.trackingSummary.currentStageKey === "shipped") {
    return "border-app-info/40 bg-app-info/10 text-app-info";
  }

  return "border-app-border-light bg-white/[0.03] text-app-primary";
}

function eventToneClass(order: OrderHistoryEntry, status: string): string {
  if (order.trackingSummary.isCanceled && status.toLowerCase().includes("скас")) {
    return "text-app-error";
  }

  if (status.toLowerCase().includes("достав")) {
    return "text-app-success";
  }

  if (status.toLowerCase().includes("передано") || status.toLowerCase().includes("надісл")) {
    return "text-app-info";
  }

  return "text-app-primary";
}

export function OrdersPageClient({ orders }: OrdersPageClientProps) {
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

  const activeOrder = useMemo(
    () => orders.find((entry) => entry.orderId === activeOrderId) ?? null,
    [activeOrderId, orders],
  );

  const totalSpent = useMemo(
    () => Number(orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)),
    [orders],
  );

  useEffect(() => {
    if (!activeOrder) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveOrderId(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeOrder]);

  return (
    <section className="space-y-8">
      <GlassPanel className="p-4 mobile:p-6">
        <p className="font-body text-[10px] uppercase tracking-[0.18em] text-app-muted">Історія замовлень</p>
        <h2 className="mt-s font-display text-[30px] leading-[1.08] text-app-primary mobile:text-[36px]">
          Ваші покупки
        </h2>
        <p className="mt-s max-w-2xl font-body text-sm text-app-secondary">
          Відкрийте будь-яке замовлення, щоб переглянути деталі, статуси та трекінг доставки.
        </p>

        <div className="mt-m grid gap-s mobile:grid-cols-3">
          <div className="rounded-soft border border-app-border-light bg-white/[0.03] p-m">
            <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">Усього замовлень</p>
            <p className={cn("mt-2 text-[24px] leading-none text-app-primary", NUMERIC_TEXT_CLASS)}>
              {orders.length}
            </p>
          </div>
          <div className="rounded-soft border border-app-border-light bg-white/[0.03] p-m">
            <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">Сума покупок</p>
            <p className={cn("mt-2 text-[24px] leading-none text-app-primary", NUMERIC_TEXT_CLASS)}>
              {formatMoney(totalSpent)}
            </p>
          </div>
          <div className="rounded-soft border border-app-border-light bg-white/[0.03] p-m">
            <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">Активні замовлення</p>
            <p className={cn("mt-2 text-[24px] leading-none text-app-primary", NUMERIC_TEXT_CLASS)}>
              {orders.filter((entry) => !entry.trackingSummary.isCanceled).length}
            </p>
          </div>
        </div>
      </GlassPanel>

      {orders.length === 0 ? (
        <div className="rounded-soft border border-app-border-light bg-white/[0.02] p-8">
          <h3 className="font-display text-[30px] text-app-primary">Ще немає замовлень</h3>
          <p className="mt-2 max-w-[520px] font-body text-sm text-app-secondary">
            Оберіть книги в каталозі та оформіть перше замовлення. Історія, трекінг і деталі з&apos;являться
            тут автоматично.
          </p>
          <Link
            href="/books"
            className="mt-6 inline-flex h-[46px] items-center justify-center rounded-sharp border border-app-white px-8 font-body text-xs uppercase tracking-[0.12em] text-app-primary transition duration-fast hover:bg-app-white hover:text-app-body"
          >
            Відкрити каталог
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-soft border border-app-border-light bg-white/[0.01]">
          {orders.map((order) => (
            <button
              key={order.orderId}
              type="button"
              onClick={() => setActiveOrderId(order.orderId)}
              className="group grid w-full grid-cols-[1fr_auto] gap-m border-b border-app-border-light px-m py-m text-left transition duration-fast last:border-b-0 hover:bg-white/[0.04] mobile:grid-cols-[96px_120px_1fr_auto_auto_22px] mobile:items-center desktop:grid-cols-[104px_128px_minmax(0,1fr)_168px_18px] desktop:gap-l"
            >
              <div className="space-y-1 mobile:space-y-0">
                <p className="font-body text-[10px] uppercase tracking-[0.14em] text-app-muted">Замовлення</p>
                <p className={ORDER_ID_CLASS}>
                  <span className="text-app-primary/82">#</span>
                  <span>{order.orderId}</span>
                </p>
              </div>

              <div className="space-y-1 mobile:space-y-0">
                <p className="font-body text-[10px] uppercase tracking-[0.14em] text-app-muted">Дата</p>
                <p className={cn("font-body text-sm text-app-secondary [font-variant-numeric:tabular-nums]")}>{formatDate(order.orderDate)}</p>
              </div>

              <div className="col-span-2 space-y-2 mobile:col-span-1">
                <p
                  className={cn(
                    "inline-flex rounded-pill border px-3 py-1 font-body text-[10px] uppercase tracking-[0.1em]",
                    statusBadgeClass(order),
                  )}
                >
                  {order.currentStatus}
                </p>

                <p className="truncate font-body text-xs text-app-muted">
                  {order.itemCount} поз. • {order.statusCount} статусів
                </p>
              </div>

              <div className="hidden space-y-1 text-right mobile:block mobile:text-left desktop:text-right">
                <p className="font-body text-[10px] uppercase tracking-[0.14em] text-app-muted">Сума</p>
                <p className={cn("text-[20px] leading-none text-app-primary", NUMERIC_TEXT_CLASS)}>
                  {order.totalAmount.toFixed(2)}
                </p>
                <p className="hidden font-body text-[11px] text-app-secondary [font-variant-numeric:tabular-nums] desktop:block">
                  {formatDateTime(order.currentStatusDate)}
                </p>
              </div>

              <div className="hidden mobile:block desktop:hidden">
                <p className="font-body text-xs text-app-secondary [font-variant-numeric:tabular-nums]">
                  {formatDateTime(order.currentStatusDate)}
                </p>
              </div>

              <div className="hidden items-center justify-end text-app-secondary transition duration-fast group-hover:text-app-primary mobile:flex">
                <ChevronRight size={16} />
              </div>

              <div className="col-span-2 mt-1 flex items-center justify-between border-t border-app-border-light/70 pt-s mobile:hidden">
                <div className="space-y-1">
                  <p className="font-body text-[10px] uppercase tracking-[0.14em] text-app-muted">Сума</p>
                  <p className={cn("text-[18px] leading-none text-app-primary", NUMERIC_TEXT_CLASS)}>
                    {formatMoney(order.totalAmount)}
                  </p>
                </div>

                <ChevronRight size={16} className="text-app-secondary transition duration-fast group-hover:text-app-primary" />
              </div>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {activeOrder ? (
          <>
            <motion.button
              aria-label="Закрити деталі замовлення"
              className="fixed inset-0 z-40 bg-black/65"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveOrderId(null)}
            />

            <motion.aside
              initial={{ x: 560 }}
              animate={{ x: 0 }}
              exit={{ x: 560 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 z-50 w-full border-l border-app-border-light bg-app-body mobile:max-w-[560px]"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-m border-b border-app-border-light px-m py-m">
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-[0.14em] text-app-muted">Деталі замовлення</p>
                    <h3 className={cn("text-[34px] leading-none text-app-primary", NUMERIC_TEXT_CLASS)}>
                      #{activeOrder.orderId}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveOrderId(null)}
                    aria-label="Закрити"
                    className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-app-border-light text-app-primary transition duration-fast hover:bg-white/[0.08]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-m overflow-y-auto px-m py-m">
                  <GlassPanel className="p-m">
                    <div className="flex flex-wrap items-center gap-s">
                      <p className="font-display text-[28px] leading-[1.12] text-app-primary">
                        Замовлення #{activeOrder.orderId}
                      </p>
                      <span
                        className={cn(
                          "rounded-pill border px-3 py-1 font-body text-[10px] uppercase tracking-[0.1em]",
                          statusBadgeClass(activeOrder),
                        )}
                      >
                        {activeOrder.currentStatus}
                      </span>
                    </div>

                    <p className="mt-s font-body text-xs text-app-secondary">
                      Створено: {formatDateTime(activeOrder.orderDate)}
                    </p>
                  </GlassPanel>

                  <div className="grid gap-s mobile:grid-cols-2">
                    <article className="rounded-soft border border-app-border-light bg-white/[0.02] p-m">
                      <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">Сума</p>
                      <p className={cn("mt-s text-[30px] leading-none text-app-primary", NUMERIC_TEXT_CLASS)}>
                        {formatMoney(activeOrder.totalAmount)}
                      </p>
                    </article>

                    <article className="rounded-soft border border-app-border-light bg-white/[0.02] p-m">
                      <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">Оплата</p>
                      <p className="mt-s truncate font-display text-[24px] leading-tight text-app-primary">
                        {activeOrder.paymentMethod}
                      </p>
                    </article>

                    <article className="rounded-soft border border-app-border-light bg-white/[0.02] p-m">
                      <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">
                        Позиції / Статуси
                      </p>
                      <p className={cn("mt-s text-[30px] leading-none text-app-primary", NUMERIC_TEXT_CLASS)}>
                        {activeOrder.itemCount} / {activeOrder.statusCount}
                      </p>
                    </article>

                    <article className="rounded-soft border border-app-border-light bg-white/[0.02] p-m">
                      <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">
                        Поточний етап
                      </p>
                      <p className="mt-s font-display text-[26px] leading-tight text-app-primary">
                        {activeOrder.trackingSummary.currentStageLabel}
                      </p>
                    </article>
                  </div>

                  <article className="rounded-soft border border-app-border-light bg-white/[0.02] p-m">
                    <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">Адреса доставки</p>
                    <p className="mt-s break-words font-body text-sm leading-relaxed text-app-secondary">
                      {activeOrder.shippingAddress}
                    </p>
                  </article>

                  <section className="space-y-s">
                    <div className="flex items-center gap-s">
                      <Truck size={15} className="text-app-secondary" />
                      <h4 className="font-display text-[24px] text-app-primary">Трекінг доставки</h4>
                    </div>

                    <article
                      className={cn(
                        "rounded-soft border p-m",
                        activeOrder.trackingSummary.isCanceled
                          ? "border-app-error/40 bg-app-error/10"
                          : "border-app-border-light bg-white/[0.02]",
                      )}
                    >
                      <div className="flex items-center gap-s">
                        <Clock3 size={14} className="text-app-secondary" />
                        <p className="font-body text-xs uppercase tracking-[0.12em] text-app-muted">Стан доставки</p>
                        <p className="ml-auto font-body text-xs text-app-secondary [font-variant-numeric:tabular-nums]">
                          {activeOrder.trackingSummary.progressPercent}%
                        </p>
                      </div>

                      <p
                        className={cn(
                          "mt-s font-body text-sm",
                          activeOrder.trackingSummary.isCanceled ? "text-app-error" : "text-app-primary",
                        )}
                      >
                        {activeOrder.trackingSummary.statusMessage}
                      </p>

                      <div className="mt-s h-2 overflow-hidden rounded-pill bg-white/10">
                        <div
                          className={cn(
                            "h-full rounded-pill transition-all duration-smooth",
                            activeOrder.trackingSummary.isCanceled ? "bg-app-error" : "bg-app-white",
                          )}
                          style={{ width: `${activeOrder.trackingSummary.progressPercent}%` }}
                        />
                      </div>

                      <p className="mt-s font-body text-xs text-app-secondary">
                        {activeOrder.trackingSummary.etaMessage}
                      </p>

                      <div className="mt-m rounded-soft border border-app-border-light bg-black/20 p-s">
                        <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">
                          Трек-номер
                        </p>
                        <p className={cn("mt-1 break-all text-[18px] leading-tight text-app-primary", NUMERIC_TEXT_CLASS)}>
                          {activeOrder.trackingSummary.trackingNumber || "Ще не присвоєно"}
                        </p>
                      </div>
                    </article>
                  </section>

                  <section className="space-y-s">
                    <h4 className="font-display text-[24px] text-app-primary">Етапи</h4>
                    <div className="rounded-soft border border-app-border-light bg-white/[0.02] p-m">
                      {activeOrder.trackingStages.map((stage, index) => (
                        <div
                          key={stage.key}
                          className={cn(
                            "relative flex gap-m pb-m",
                            index === activeOrder.trackingStages.length - 1 && "pb-0",
                          )}
                        >
                          <div className="relative mt-1 flex w-4 flex-none justify-center">
                            <span
                              className={cn(
                                "h-3 w-3 rounded-full border",
                                stage.active
                                  ? "border-app-white bg-app-white"
                                  : stage.reached
                                    ? "border-app-border-hover bg-white/70"
                                    : "border-app-border-light bg-transparent",
                              )}
                            />
                            {index < activeOrder.trackingStages.length - 1 ? (
                              <span
                                className={cn(
                                  "absolute left-1/2 top-3 h-[calc(100%+2px)] w-px -translate-x-1/2",
                                  stage.reached ? "bg-white/35" : "bg-white/15",
                                )}
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className={cn("font-body text-sm", stage.active ? "text-app-primary" : "text-app-secondary")}>{stage.label}</p>
                            <p className="mt-1 font-body text-xs text-app-muted">
                              {stage.reached && stage.reachedAt
                                ? formatDateTime(stage.reachedAt)
                                : "Очікується"}
                            </p>
                          </div>
                        </div>
                      ))}

                      {activeOrder.trackingSummary.isCanceled ? (
                        <div className="mt-m rounded-soft border border-app-error/40 bg-app-error/10 px-m py-s">
                          <p className="font-body text-xs uppercase tracking-[0.12em] text-app-error">
                            Замовлення скасовано
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <section className="space-y-s">
                    <h4 className="font-display text-[24px] text-app-primary">Історія статусів</h4>

                    {activeOrder.statuses.length === 0 ? (
                      <div className="rounded-soft border border-app-border-light bg-white/[0.02] p-m">
                        <p className="font-body text-sm text-app-secondary">Історія статусів ще порожня.</p>
                      </div>
                    ) : (
                      <div className="space-y-s">
                        {[...activeOrder.statuses].reverse().map((event) => (
                          <article
                            key={`${event.orderStatusId}-${event.statusDate}`}
                            className="rounded-soft border border-app-border-light bg-white/[0.02] p-m"
                          >
                            <div className="flex flex-wrap items-center gap-s">
                              <p className={cn("font-body text-sm", eventToneClass(activeOrder, event.status))}>
                                {event.status}
                              </p>
                              <p className="ml-auto font-body text-xs text-app-muted [font-variant-numeric:tabular-nums]">
                                {formatDateTime(event.statusDate)}
                              </p>
                            </div>

                            {event.trackingNumber ? (
                              <p className="mt-1 font-body text-xs text-app-secondary">
                                Трек-номер: <span className="text-app-primary">{event.trackingNumber}</span>
                              </p>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-s pb-m">
                    <div className="flex items-center gap-s">
                      <Package size={15} className="text-app-secondary" />
                      <h4 className="font-display text-[24px] text-app-primary">Куплені книги</h4>
                    </div>

                    {activeOrder.items.length === 0 ? (
                      <div className="rounded-soft border border-app-border-light bg-white/[0.02] p-m">
                        <p className="font-body text-sm text-app-secondary">Позиції замовлення не знайдено.</p>
                      </div>
                    ) : (
                      <div className="space-y-s">
                        {activeOrder.items.map((item) => (
                          <article
                            key={item.orderItemId}
                            className="grid grid-cols-[58px_1fr] gap-m rounded-soft border border-app-border-light bg-white/[0.02] p-m"
                          >
                            <BookCover
                              title={item.title}
                              imagePath={item.coverImagePath}
                              className="h-[86px] w-[58px] rounded-sharp"
                              imageClassName="brightness-[0.92] contrast-[1.06] saturate-[0.88] sepia-[0.12]"
                            />

                            <div className="min-w-0 space-y-1">
                              <p className="truncate font-display text-[20px] leading-tight text-app-primary">
                                {item.title}
                              </p>
                              <p className="truncate font-body text-xs text-app-muted">{item.authors}</p>

                              <div className="flex flex-wrap items-center gap-s pt-1">
                                <span className="rounded-pill border border-app-border-light px-3 py-1 font-body text-[10px] uppercase tracking-[0.1em] text-app-secondary">
                                  {item.quantity} шт.
                                </span>
                                <span className="font-body text-xs text-app-secondary">
                                  {item.pricePerUnit.toFixed(2)} UAH / шт.
                                </span>
                                <span className={cn("ml-auto text-[20px] leading-none text-app-primary", NUMERIC_TEXT_CLASS)}>
                                  {item.subtotal.toFixed(2)} UAH
                                </span>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <div className="h-1" />
                </div>

                <div className="border-t border-app-border-light px-m py-s">
                  <button
                    type="button"
                    onClick={() => setActiveOrderId(null)}
                    className="inline-flex h-[44px] w-full items-center justify-center rounded-sharp border border-app-white bg-transparent font-body text-xs uppercase tracking-[0.12em] text-app-primary transition duration-fast hover:bg-app-white hover:text-app-body"
                  >
                    Закрити панель
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
