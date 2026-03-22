"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuthSession } from "@/components/providers/auth-session-provider";
import { useCart } from "@/components/providers/cart-provider";
import { resolvePageTitle } from "@/lib/routing";

const AiChatWidget = dynamic(
  () => import("@/components/ai/ai-chat-widget").then((module) => module.AiChatWidget),
  {
    ssr: false,
  },
);

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname() ?? "/";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [enablePageTransitions, setEnablePageTransitions] = useState(false);
  const { session } = useAuthSession();
  const { cartCount } = useCart();

  const pageTitle = useMemo(() => resolvePageTitle(pathname), [pathname]);

  const isAdmin = Boolean(session?.isAdmin);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    setEnablePageTransitions(true);
  }, []);

  const pageTransition = {
    duration: 0.24,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-app-body text-app-primary">
      <div className="fixed inset-y-0 left-0 z-40 hidden desktop:block">
        <AppSidebar pathname={pathname} isAdmin={isAdmin} cartCount={cartCount} className="h-screen" />
      </div>

      <AnimatePresence>
        {mobileSidebarOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Закрити меню"
              className="app-overlay-backdrop fixed inset-0 z-40 desktop:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileSidebarOpen(false)}
            />

            <motion.div
              initial={{ x: -128, opacity: 0.75 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -128, opacity: 0.6 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 desktop:hidden"
            >
              <AppSidebar
                pathname={pathname}
                isAdmin={isAdmin}
                cartCount={cartCount}
                onNavigate={() => setMobileSidebarOpen(false)}
                className="h-screen"
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="relative flex min-h-screen flex-col desktop:pl-[var(--layout-sidebar-width)]">
        <AppHeader
          pageTitle={pageTitle}
          cartCount={cartCount}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          showMenuButton={false}
        />

        <main className="flex-1 px-4 pb-8 pt-l mobile:px-10 mobile:pb-10 mobile:pt-xl desktop:px-10 desktop:pb-12 compact:px-[60px]">
          {enablePageTransitions ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={pageTransition}
                className="will-change-opacity"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div>{children}</div>
          )}
        </main>

        <footer className="border-t border-app-border-light px-4 pb-[76px] pt-4 text-center font-body text-[10px] uppercase tracking-[0.18em] text-app-muted mobile:px-10 mobile:pb-[82px] desktop:px-10 desktop:pb-8 desktop:pt-6 compact:px-[60px]">
          Patsera Ihor 2026
        </footer>
      </div>

      <MobileBottomNav pathname={pathname} isAdmin={isAdmin} />
      <AiChatWidget />
    </div>
  );
}
