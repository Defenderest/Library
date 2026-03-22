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
  refreshSession: () => Promise<SessionUser | null>;
  setSession: Dispatch<SetStateAction<SessionUser | null>>;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setSession(null);
        return null;
      }

      const data = (await response.json()) as { session?: SessionUser | null };
      const nextSession = data.session ?? null;
      setSession(nextSession);
      return nextSession;
    } catch (error) {
      console.warn("Failed to refresh session:", error);
      setSession(null);
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
