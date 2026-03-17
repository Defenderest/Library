"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { cn } from "@/lib/cn";

type AddToCartButtonProps = {
  bookId: number;
  stockQuantity: number;
  className?: string;
};

export function AddToCartButton({ bookId, stockQuantity, className }: AddToCartButtonProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [submitting, setSubmitting] = useState(false);

  const outOfStock = stockQuantity <= 0;

  const handleAddToCart = async () => {
    if (outOfStock || submitting) {
      return;
    }

    setSubmitting(true);

    const result = await addToCart(bookId, 1);

    if (!result.ok && result.requiresAuth) {
      const message = encodeURIComponent("Щоб додавати книги в кошик, увійдіть у профіль");
      router.push(`/profile?message=${message}`);
      setSubmitting(false);
      return;
    }

    if (!result.ok) {
      setSubmitting(false);
      return;
    }

    setTimeout(() => {
      setSubmitting(false);
    }, 260);
  };

  if (outOfStock) {
    return (
      <div
        className={cn(
          "flex h-[42px] w-full items-center justify-center rounded-sharp border border-app-border-light bg-transparent font-body text-[11px] uppercase tracking-[0.08em] text-app-secondary/80 opacity-60",
          className,
        )}
      >
        Немає в наявності
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={submitting}
      className={cn(
        "flex h-[42px] w-full items-center justify-center rounded-sharp border border-app-white bg-transparent font-body text-[11px] uppercase tracking-[0.08em] text-app-primary transition duration-fast hover:bg-app-white hover:text-app-body disabled:opacity-60",
        className,
      )}
    >
      {submitting ? "Додаємо..." : "Додати в кошик"}
    </button>
  );
}
