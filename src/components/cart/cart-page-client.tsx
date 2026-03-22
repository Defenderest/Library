"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { BookCover } from "@/components/books/book-cover";
import { useCart } from "@/components/providers/cart-provider";
import { cn } from "@/lib/cn";
import type { CartSummaryData } from "@/lib/cart/types";
import {
  checkoutFormSchema,
  PAYMENT_METHOD_OPTIONS,
  type CheckoutFormValues,
} from "@/lib/cart/validation";

type CartPageClientProps = {
  initialInfoMessage?: string;
};

type CartAction = "increase" | "decrease";

type CartApiResponse = {
  cart?: CartSummaryData;
  error?: string;
};

type LiqPayApiResponse = {
  state?: "success" | "pending" | "failed" | "canceled" | "expired";
  orderId?: number;
  message?: string;
  checkoutUrl?: string;
  providerOrderId?: string;
  error?: string;
};

function formatMoney(value: number): string {
  return `${value.toFixed(2)} UAH`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 font-body text-xs text-app-error">{message}</p>;
}

export function CartPageClient({ initialInfoMessage = "" }: CartPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCartCount } = useCart();
  const liqPayReturnHandled = useRef(false);

  const [cart, setCart] = useState<CartSummaryData>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
  });
  const [loading, setLoading] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState(initialInfoMessage);
  const [checkoutError, setCheckoutError] = useState(false);
  const [rowActionBookId, setRowActionBookId] = useState<number | null>(null);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  const checkoutForm = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      city: "",
      street: "",
      house: "",
      paymentMethod: PAYMENT_METHOD_OPTIONS[0],
    },
  });

  const paymentMethod = checkoutForm.watch("paymentMethod");
  const confirmButtonText = paymentMethod === "LiqPay" ? "Перейти до LiqPay" : "Підтвердити замовлення";

  const redirectToProfile = useCallback(() => {
    const message = encodeURIComponent("Щоб працювати з кошиком, увійдіть у профіль");
    router.push(`/profile?message=${message}`);
  }, [router]);

  const applyCartState = useCallback(
    (nextCart: CartSummaryData) => {
      setCart(nextCart);
      setCartCount(nextCart.totalItems);
    },
    [setCartCount],
  );

  const loadCart = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as CartApiResponse | null;

      if (response.status === 401) {
        redirectToProfile();
        return;
      }

      if (!response.ok || !data?.cart) {
        setCheckoutError(true);
        setCheckoutMessage(data?.error || "Не вдалося завантажити кошик");
        return;
      }

      applyCartState(data.cart);
    } catch {
      setCheckoutError(true);
      setCheckoutMessage("Не вдалося завантажити кошик");
    } finally {
      setLoading(false);
    }
  }, [applyCartState, redirectToProfile]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  useEffect(() => {
    if (liqPayReturnHandled.current) {
      return;
    }

    const flow = searchParams.get("liqpay");
    const providerOrderId = searchParams.get("providerOrderId");

    if (flow !== "return" || !providerOrderId) {
      return;
    }

    liqPayReturnHandled.current = true;
    setCheckoutError(false);
    setCheckoutMessage("Перевіряємо статус платежу LiqPay...");
    setCheckoutStep(false);

    void (async () => {
      try {
        const response = await fetch("/api/checkout/liqpay/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ providerOrderId }),
        });

        const data = (await response.json().catch(() => null)) as LiqPayApiResponse | null;

        if (response.status === 401) {
          redirectToProfile();
          return;
        }

        if (!response.ok) {
          setCheckoutError(true);
          setCheckoutMessage(data?.error || "Не вдалося перевірити платіж LiqPay");
          return;
        }

        setCheckoutError(data?.state !== "success");
        setCheckoutMessage(data?.message || "Статус платежу оновлено");

        if (data?.state === "success") {
          await loadCart();
        }
      } catch {
        setCheckoutError(true);
        setCheckoutMessage("Не вдалося перевірити платіж LiqPay");
      } finally {
        router.replace("/cart");
      }
    })();
  }, [loadCart, redirectToProfile, router, searchParams]);

  const runRowAction = useCallback(
    async (bookId: number, action: CartAction) => {
      setCheckoutMessage("");
      setCheckoutError(false);
      setRowActionBookId(bookId);

      try {
        const response = await fetch(`/api/cart/items/${bookId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        });

        const data = (await response.json().catch(() => null)) as CartApiResponse | null;

        if (response.status === 401) {
          redirectToProfile();
          return;
        }

        if (!response.ok || !data?.cart) {
          setCheckoutError(true);
          setCheckoutMessage(data?.error || "Не вдалося змінити кількість");
          return;
        }

        applyCartState(data.cart);
      } catch {
        setCheckoutError(true);
        setCheckoutMessage("Не вдалося змінити кількість");
      } finally {
        setRowActionBookId(null);
      }
    },
    [applyCartState, redirectToProfile],
  );

  const removeItem = useCallback(
    async (bookId: number) => {
      setCheckoutMessage("");
      setCheckoutError(false);
      setRowActionBookId(bookId);

      try {
        const response = await fetch(`/api/cart/items/${bookId}`, {
          method: "DELETE",
        });

        const data = (await response.json().catch(() => null)) as CartApiResponse | null;

        if (response.status === 401) {
          redirectToProfile();
          return;
        }

        if (!response.ok || !data?.cart) {
          setCheckoutError(true);
          setCheckoutMessage(data?.error || "Не вдалося видалити позицію");
          return;
        }

        applyCartState(data.cart);
      } catch {
        setCheckoutError(true);
        setCheckoutMessage("Не вдалося видалити позицію");
      } finally {
        setRowActionBookId(null);
      }
    },
    [applyCartState, redirectToProfile],
  );

  const openCheckoutStep = () => {
    setCheckoutMessage("");
    setCheckoutError(false);
    setCheckoutStep(true);
  };

  const returnToCart = () => {
    setCheckoutStep(false);
  };

  const submitCheckout = checkoutForm.handleSubmit(async (values) => {
    setCheckoutMessage("");
    setCheckoutError(false);

    setCheckoutSubmitting(true);

    try {
      const endpoint =
        values.paymentMethod === "LiqPay" ? "/api/checkout/liqpay/start" : "/api/checkout/order";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            orderId?: number;
            totalAmount?: number;
            message?: string;
            error?: string;
            checkoutUrl?: string;
            providerOrderId?: string;
          }
        | null;

      if (response.status === 401) {
        redirectToProfile();
        return;
      }

      if (!response.ok) {
        setCheckoutError(true);
        setCheckoutMessage(data?.error || "Не вдалося оформити замовлення");
        return;
      }

      if (values.paymentMethod === "LiqPay") {
        if (!data?.checkoutUrl) {
          setCheckoutError(true);
          setCheckoutMessage("Не вдалося створити платіж LiqPay");
          return;
        }

        setCheckoutError(false);
        setCheckoutMessage("Переходимо до LiqPay...");
        window.location.href = data.checkoutUrl;
        return;
      }

      setCheckoutError(false);
      setCheckoutMessage(data?.message || "Замовлення успішно оформлено");
      setCheckoutStep(false);

      checkoutForm.reset({
        city: "",
        street: "",
        house: "",
        paymentMethod: PAYMENT_METHOD_OPTIONS[0],
      });

      await loadCart();
    } catch {
      setCheckoutError(true);
      setCheckoutMessage("Не вдалося оформити замовлення");
    } finally {
      setCheckoutSubmitting(false);
    }
  });

  if (loading) {
    return (
      <div className="rounded-soft border border-app-border-light bg-app-card p-8">
        <p className="font-body text-sm text-app-secondary">Завантаження кошика...</p>
      </div>
    );
  }

  return (
    <section className="space-y-8 pt-l">
      {!checkoutStep ? (
        <>
          {cart.items.length === 0 ? (
            <div className="app-subtle-surface rounded-soft border border-app-border-light p-8">
              <h2 className="font-display text-3xl text-app-primary">Кошик порожній</h2>
              <p className="mt-2 max-w-[420px] font-body text-sm text-app-secondary">
                Додайте книги з каталогу або сторінки книги, щоб оформити замовлення.
              </p>
              <Link
                href="/books"
                className="mt-6 inline-flex h-[46px] items-center justify-center rounded-sharp border border-app-border-hover px-8 font-body text-xs uppercase tracking-[0.12em] text-app-primary transition duration-fast hover:bg-app-hover"
              >
                Відкрити каталог
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-0">
                {cart.items.map((item) => (
                  <article
                    key={item.bookId}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-m border-b border-app-border-light py-l mobile:grid-cols-[1fr_auto_auto_auto] mobile:gap-l"
                  >
                    <div className="col-span-3 flex min-w-0 items-center gap-m mobile:col-span-1 mobile:gap-xl">
                      <BookCover
                        title={item.title}
                        imagePath={item.coverImagePath}
                        className="h-[82px] w-[56px] flex-none mobile:h-[90px] mobile:w-[60px]"
                        imageClassName="brightness-[0.9] contrast-[1.08] saturate-[0.86] sepia-[0.16]"
                      />

                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-display text-[18px] text-app-primary mobile:text-[20px]">
                          {item.title}
                        </p>
                        <p className="truncate font-body text-xs text-app-muted">{item.author}</p>
                        <p className="font-body text-xs text-app-secondary">{item.price.toFixed(2)} UAH / шт</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-m">
                      <button
                        type="button"
                        onClick={() => runRowAction(item.bookId, "decrease")}
                        disabled={rowActionBookId === item.bookId}
                        className="text-app-primary transition duration-fast hover:text-app-secondary disabled:opacity-40"
                        aria-label="Зменшити кількість"
                      >
                        <Minus size={18} />
                      </button>

                      <span className="min-w-[22px] text-center font-display text-xl text-app-primary">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => runRowAction(item.bookId, "increase")}
                        disabled={rowActionBookId === item.bookId}
                        className="text-app-primary transition duration-fast hover:text-app-secondary disabled:opacity-40"
                        aria-label="Збільшити кількість"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <p className="text-right font-display text-xl text-app-primary">
                      {formatMoney(item.subtotal)}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeItem(item.bookId)}
                      disabled={rowActionBookId === item.bookId}
                      className="justify-self-end text-app-secondary transition duration-fast hover:text-app-error disabled:opacity-40"
                      aria-label="Видалити позицію"
                    >
                      <Trash2 size={18} />
                    </button>
                  </article>
                ))}
              </div>

              <div className="flex flex-col items-start gap-s pt-m mobile:items-end">
                <p className="font-body text-xs uppercase tracking-[0.12em] text-app-muted">Усього позицій: {cart.totalItems}</p>
                <p className="font-display text-4xl text-app-primary mobile:text-5xl">{formatMoney(cart.totalPrice)}</p>

                <button
                  type="button"
                  onClick={openCheckoutStep}
                  disabled={cart.totalItems <= 0}
                  className="mt-s flex h-[50px] w-full items-center justify-center rounded-sharp border border-app-border-hover bg-transparent font-body text-xs uppercase tracking-[0.14em] text-app-primary transition duration-fast hover:bg-app-hover disabled:opacity-45 mobile:w-[260px]"
                >
                  Оформити замовлення
                </button>
              </div>
            </>
          )}

          {checkoutMessage.length > 0 ? (
            <p className={cn("text-right font-body text-sm", checkoutError ? "text-app-error" : "text-app-success")}>
              {checkoutMessage}
            </p>
          ) : null}
        </>
      ) : (
        <div className="app-subtle-surface rounded-soft border border-app-border-light p-xl">
          <form onSubmit={submitCheckout} className="space-y-l">
            <div className="flex flex-wrap items-center gap-m">
              <button
                type="button"
                onClick={returnToCart}
                className="app-subtle-surface-strong flex h-[38px] items-center justify-center rounded-pill border border-app-border-light px-l font-body text-xs text-app-primary transition duration-fast hover:border-app-border-hover hover:bg-app-hover"
              >
                ← Назад до кошика
              </button>

              <div className="app-subtle-surface-strong ml-auto rounded-pill border border-app-border-light px-4 py-2">
                <p className="font-body text-[10px] uppercase tracking-[0.1em] text-app-primary">
                  Сума: {formatMoney(cart.totalPrice)}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="font-display text-[32px] text-app-primary">Оформлення замовлення</h2>
              <p className="font-body text-sm text-app-secondary">
                Перевірте адресу, оберіть спосіб оплати та підтвердіть замовлення.
              </p>
            </div>

            <div className="grid gap-xl compact:grid-cols-2">
              <div className="space-y-m">
                <div>
                  <label className="font-body text-[10px] uppercase tracking-[0.1em] text-app-muted">Місто</label>
                  <input
                    {...checkoutForm.register("city")}
                    className="app-subtle-surface mt-1 h-12 w-full rounded-soft border border-app-border-light px-m font-body text-sm text-app-primary outline-none transition duration-fast focus:border-app-border-hover"
                    placeholder="Наприклад: Київ"
                  />
                  <FieldError message={checkoutForm.formState.errors.city?.message} />
                </div>

                <div>
                  <label className="font-body text-[10px] uppercase tracking-[0.1em] text-app-muted">Вулиця</label>
                  <input
                    {...checkoutForm.register("street")}
                    className="app-subtle-surface mt-1 h-12 w-full rounded-soft border border-app-border-light px-m font-body text-sm text-app-primary outline-none transition duration-fast focus:border-app-border-hover"
                    placeholder="Наприклад: Хрещатик"
                  />
                  <FieldError message={checkoutForm.formState.errors.street?.message} />
                </div>

                <div>
                  <label className="font-body text-[10px] uppercase tracking-[0.1em] text-app-muted">Будинок</label>
                  <input
                    {...checkoutForm.register("house")}
                    className="app-subtle-surface mt-1 h-12 w-full rounded-soft border border-app-border-light px-m font-body text-sm text-app-primary outline-none transition duration-fast focus:border-app-border-hover"
                    placeholder="Наприклад: 12Б"
                  />
                  <FieldError message={checkoutForm.formState.errors.house?.message} />
                </div>
              </div>

              <div className="space-y-m">
                <div>
                  <label className="font-body text-[10px] uppercase tracking-[0.1em] text-app-muted">Спосіб оплати</label>
                  <select
                    {...checkoutForm.register("paymentMethod")}
                    className="app-subtle-surface mt-1 h-12 w-full rounded-soft border border-app-border-light px-m font-body text-sm text-app-primary outline-none transition duration-fast focus:border-app-border-hover"
                  >
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-app-body text-app-primary">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="app-subtle-surface rounded-soft border border-app-border-light p-m">
                  <div className="flex items-center gap-s">
                    <ShieldCheck size={16} className="text-app-secondary" />
                    <p className="font-body text-xs text-app-secondary">
                      Дані замовлення передаються через захищене з&apos;єднання.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-s">
              <button
                type="submit"
                disabled={checkoutSubmitting || cart.totalItems <= 0}
                className="flex h-[54px] w-full max-w-full items-center justify-center rounded-pill border border-app-border-hover bg-transparent font-body text-xs uppercase tracking-[0.14em] text-app-primary transition duration-fast hover:bg-app-hover disabled:opacity-45 mobile:w-[320px]"
              >
                {checkoutSubmitting ? "Обробка..." : confirmButtonText}
              </button>

              {checkoutMessage.length > 0 ? (
                <p className={cn("font-body text-sm", checkoutError ? "text-app-error" : "text-app-success")}>
                  {checkoutMessage}
                </p>
              ) : null}
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
