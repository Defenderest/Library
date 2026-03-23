"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";

import type { SessionUser } from "@/lib/auth/types";

type AuthSessionContextValue = {
  session: SessionUser | null;
  loading: boolean;
  bootstrapCartCount: number;
  bootstrapCartCustomerId: number | null;
  refreshSession: () => Promise<SessionUser | null>;
  setSession: Dispatch<SetStateAction<SessionUser | null>>;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapCartCount, setBootstrapCartCount] = useState(0);
  const [bootstrapCartCustomerId, setBootstrapCartCustomerId] = useState<number | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/bootstrap/session", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setSession(null);
        setBootstrapCartCount(0);
        setBootstrapCartCustomerId(null);
        return null;
      }

      const data = (await response.json()) as {
        session?: SessionUser | null;
        cartCount?: number;
      };
      const nextSession = data.session ?? null;
      const nextCartCount =
        typeof data.cartCount === "number" && Number.isFinite(data.cartCount)
          ? Math.max(0, Math.floor(data.cartCount))
          : 0;

      setSession(nextSession);

      if (nextSession) {
        setBootstrapCartCount(nextCartCount);
        setBootstrapCartCustomerId(nextSession.customerId);
      } else {
        setBootstrapCartCount(0);
        setBootstrapCartCustomerId(null);
      }

      return nextSession;
    } catch (error) {
      console.warn("Failed to refresh session:", error);
      setSession(null);
      setBootstrapCartCount(0);
      setBootstrapCartCustomerId(null);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      setSession(null);
      setBootstrapCartCount(0);
      setBootstrapCartCustomerId(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      await refreshSession();
      if (mounted) {
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [refreshSession]);

  const value = {
    session,
    loading,
    bootstrapCartCount,
    bootstrapCartCustomerId,
    refreshSession,
    setSession,
    logout,
  };

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider");
  }

  return context;
}
