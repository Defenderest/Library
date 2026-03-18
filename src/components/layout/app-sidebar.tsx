"use client";

import Link from "next/link";

import { APP_NAV_ITEMS, isNavPathActive } from "@/components/layout/navigation-config";
import { cn } from "@/lib/cn";

type SidebarProps = {
  pathname: string;
  isAdmin: boolean;
  cartCount: number;
  onNavigate?: () => void;
  className?: string;
};

export function AppSidebar({ pathname, isAdmin, cartCount, onNavigate, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative flex w-[var(--layout-sidebar-width)] flex-col bg-[rgba(5,5,5,0.5)] text-app-primary backdrop-blur-[20px]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-app-border-light" />

      <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 select-none font-display text-xl italic font-semibold tracking-[0.12em] text-app-primary/80 [writing-mode:vertical-rl] [transform:translateX(-50%)_rotate(180deg)] compact:top-10 compact:text-2xl">
        LUXE.
      </div>

      <nav className="mt-[150px] flex flex-col items-center gap-4 px-s pb-8 compact:mt-[190px] compact:gap-5">
        {APP_NAV_ITEMS.filter((item) => (item.adminOnly ? isAdmin : true)).map((item) => {
          const Icon = item.icon;
          const active = isNavPathActive(pathname, item.href);

          return (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                prefetch={false}
                aria-label={item.label}
                onClick={onNavigate}
                className={cn(
                  "relative flex h-[46px] w-[46px] items-center justify-center rounded-full border border-transparent transition duration-normal compact:h-[50px] compact:w-[50px]",
                  active
                    ? "bg-white/[0.05] text-app-primary"
                    : "text-app-primary/65 hover:border-app-border-light hover:text-app-primary",
                )}
              >
                <Icon size={16} strokeWidth={1.75} />

                {item.showCartBadge && cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-app-white px-1 font-body text-[10px] font-semibold text-app-body">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </Link>

              <span
                className={cn(
                  "pointer-events-none absolute -right-[26px] top-1/2 h-5 w-[3px] -translate-y-1/2 bg-app-white",
                  active ? "opacity-100" : "opacity-0",
                )}
              />

              <span className="pointer-events-none absolute left-[62px] top-1/2 -translate-y-1/2 rounded-sharp bg-app-white px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.08em] text-app-body opacity-0 transition duration-fast group-hover:opacity-100 group-focus-within:opacity-100 compact:left-[70px]">
                {item.label}
              </span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
