"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import { useAuthSession } from "@/components/providers/auth-session-provider";

type AddToCartResult = {
  ok: boolean;
  error?: string;
  requiresAuth?: boolean;
};

type CartContextValue = {
  cartCount: number;
  loading: boolean;
  refreshCartCount: () => Promise<void>;
  addToCart: (bookId: number, quantity?: number) => Promise<AddToCartResult>;
  setCartCount: (count: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function extractCount(data: unknown): number {
  if (!data || typeof data !== "object") {
    return 0;
  }

  const maybeCart = (data as { cart?: { totalItems?: number } }).cart;
  const count = maybeCart?.totalItems;
  return typeof count === "number" && Number.isFinite(count) ? Math.max(0, count) : 0;
}

export function CartProvider({ children }: PropsWithChildren) {
  const { session } = useAuthSession();
  const [cartCount, setCartCountState] = useState(0);
  const [loading, setLoading] = useState(true);

  const setCartCount = useCallback((count: number) => {
    setCartCountState(Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0);
  }, []);

  const refreshCartCount = useCallback(async () => {
    if (!session) {
      setCartCountState(0);
      return;
    }

    try {
      const response = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setCartCountState(0);
        return;
      }

      const data = await response.json();
      setCartCountState(extractCount(data));
    } catch (error) {
      console.warn("Failed to refresh cart count:", error);
      setCartCountState(0);
    }
  }, [session]);

  const addToCart = useCallback(
    async (bookId: number, quantity = 1): Promise<AddToCartResult> => {
      if (!session) {
        return {
          ok: false,
          requiresAuth: true,
          error: "Щоб додавати книги в кошик, увійдіть у профіль",
        };
      }

      try {
        const response = await fetch("/api/cart/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookId,
            quantity,
          }),
        });

        const data = (await response.json().catch(() => null)) as
          | { cart?: { totalItems?: number }; error?: string }
          | null;

        if (response.status === 401) {
          setCartCountState(0);
          return {
            ok: false,
            requiresAuth: true,
            error: data?.error || "Щоб додавати книги в кошик, увійдіть у профіль",
          };
        }

        if (!response.ok) {
          return {
            ok: false,
            error: data?.error || "Не вдалося додати книгу в кошик",
          };
        }

        setCartCountState(extractCount(data));

        return {
          ok: true,
        };
      } catch (error) {
        console.warn("Failed to add cart item:", error);
        return {
          ok: false,
          error: "Не вдалося додати книгу в кошик",
        };
      }
    },
    [session],
  );

  useEffect(() => {
    let active = true;

    void (async () => {
      await refreshCartCount();
      if (active) {
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [refreshCartCount]);

  useEffect(() => {
    if (!session) {
      setCartCountState(0);
    }
  }, [session]);

  const value = {
    cartCount,
    loading,
    refreshCartCount,
    addToCart,
    setCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
