"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuthSession } from "@/components/providers/auth-session-provider";
import { useCart } from "@/components/providers/cart-provider";
import { resolvePageTitle } from "@/lib/routing";

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname() ?? "/";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { session } = useAuthSession();
  const { cartCount } = useCart();

  const pageTitle = useMemo(() => resolvePageTitle(pathname), [pathname]);

  const isAdmin = Boolean(session?.isAdmin);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

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
              className="fixed inset-0 z-40 bg-black/55 desktop:hidden"
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

      <div className="relative min-h-screen desktop:pl-[var(--layout-sidebar-width)]">
        <AppHeader
          pageTitle={pageTitle}
          cartCount={cartCount}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="px-6 pb-[60px] pt-l mobile:px-10 mobile:pt-xl desktop:px-[60px]">
          {children}
        </main>
      </div>
    </div>
  );
}
