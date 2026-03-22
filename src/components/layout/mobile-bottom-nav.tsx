"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";

import { APP_NAV_ITEMS, isNavPathActive } from "@/components/layout/navigation-config";
import { cn } from "@/lib/cn";

type MobileBottomNavProps = {
  pathname: string;
  isAdmin: boolean;
};

type CapsuleMetrics = {
  left: number;
  width: number;
};

const EMPTY_METRICS: CapsuleMetrics = {
  left: 0,
  width: 0,
};

export function MobileBottomNav({ pathname, isAdmin }: MobileBottomNavProps) {
  const router = useRouter();
  const navItems = useMemo(
    () => APP_NAV_ITEMS.filter((item) => item.mobilePrimary && (!item.adminOnly || isAdmin)),
    [isAdmin],
  );

  const [optimisticActiveIndex, setOptimisticActiveIndex] = useState<number | null>(null);

  const matchedPathIndex = navItems.findIndex((item) => isNavPathActive(pathname, item.href));
  const activeIndex = optimisticActiveIndex ?? matchedPathIndex;
  const hasActiveItem = activeIndex >= 0;

  const railRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const dragStartRef = useRef<{ pointerX: number; capsuleLeft: number } | null>(null);

  const [capsuleMetrics, setCapsuleMetrics] = useState<CapsuleMetrics>(EMPTY_METRICS);
  const [dragLeft, setDragLeft] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setOptimisticActiveIndex(null);
  }, [pathname]);

  const getItemMetrics = (index: number): CapsuleMetrics | null => {
    const railRect = railRef.current?.getBoundingClientRect();
    const itemRect = itemRefs.current[index]?.getBoundingClientRect();

    if (!railRect || !itemRect) {
      return null;
    }

    return {
      left: itemRect.left - railRect.left,
      width: itemRect.width,
    };
  };

  useEffect(() => {
    const syncActiveCapsule = () => {
      if (isDragging) {
        return;
      }

      if (!hasActiveItem) {
        setCapsuleMetrics(EMPTY_METRICS);
        return;
      }

      const nextMetrics = getItemMetrics(activeIndex);
      if (nextMetrics) {
        setCapsuleMetrics(nextMetrics);
      }
    };

    syncActiveCapsule();

    const handleResize = () => {
      syncActiveCapsule();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [activeIndex, hasActiveItem, isDragging, navItems.length]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const allMetrics = navItems.map((_, index) => getItemMetrics(index)).filter(Boolean) as CapsuleMetrics[];
    if (allMetrics.length === 0) {
      return;
    }

    const minLeft = allMetrics[0].left;
    const maxLeft = allMetrics[allMetrics.length - 1].left;

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStartRef.current) {
        return;
      }

      const delta = event.clientX - dragStartRef.current.pointerX;
      const nextLeft = dragStartRef.current.capsuleLeft + delta;
      setDragLeft(Math.min(maxLeft, Math.max(minLeft, nextLeft)));
    };

    const handlePointerUp = () => {
      const currentLeft = dragLeft ?? capsuleMetrics.left;
      const currentCenter = currentLeft + capsuleMetrics.width / 2;

      let closestIndex = activeIndex >= 0 ? activeIndex : 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      navItems.forEach((item, index) => {
        const metrics = getItemMetrics(index);
        if (!metrics) {
          return;
        }

        const itemCenter = metrics.left + metrics.width / 2;
        const distance = Math.abs(itemCenter - currentCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      const nextMetrics = getItemMetrics(closestIndex);
      if (nextMetrics) {
        setCapsuleMetrics(nextMetrics);
      }

      setIsDragging(false);
      setDragLeft(null);
      dragStartRef.current = null;
      document.body.style.userSelect = "";

      const nextItem = navItems[closestIndex];
      if (nextItem && nextItem.href !== pathname) {
        setOptimisticActiveIndex(closestIndex);
        router.push(nextItem.href);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      document.body.style.userSelect = "";
    };
  }, [activeIndex, capsuleMetrics.left, capsuleMetrics.width, dragLeft, isDragging, navItems, pathname, router]);

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!hasActiveItem) {
      return;
    }

    const currentMetrics = getItemMetrics(activeIndex);
    if (!currentMetrics) {
      return;
    }

    dragStartRef.current = {
      pointerX: event.clientX,
      capsuleLeft: currentMetrics.left,
    };

    setCapsuleMetrics(currentMetrics);
    setDragLeft(currentMetrics.left);
    setIsDragging(true);
    document.body.style.userSelect = "none";
  };

  const capsuleLeft = dragLeft ?? capsuleMetrics.left;

  return (
    <div className="mobile-bottom-nav-shell z-40 transition-[opacity,transform] duration-fast desktop:hidden">
      <motion.nav
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-[var(--mobile-bottom-nav-height)] w-full rounded-[999px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(11,11,13,0.78)_0%,rgba(6,6,8,0.92)_100%)] px-[5px] py-[5px] shadow-[0_18px_36px_rgba(0,0,0,0.34)] backdrop-blur-[28px]"
      >
        <span className="pointer-events-none absolute inset-x-[16%] top-0 h-[1px] bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0)_100%)]" />
        <span className="pointer-events-none absolute inset-0 rounded-[999px] bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0)_48%,rgba(0,0,0,0.14)_100%)]" />

        <div
          ref={railRef}
          className="relative grid h-full gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
          {hasActiveItem && capsuleMetrics.width > 0 ? (
            <motion.button
              type="button"
              aria-label="Перетягнути активну вкладку"
              onPointerDown={startDrag}
              className={cn(
                "absolute inset-y-[1px] left-0 z-10 rounded-[999px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.014)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_6px_16px_rgba(0,0,0,0.16)] backdrop-blur-[18px] touch-none",
                isDragging && "cursor-grabbing",
              )}
              animate={{ x: capsuleLeft, width: capsuleMetrics.width, scale: isDragging ? 1.02 : 1 }}
              transition={
                isDragging
                  ? { duration: 0.12, ease: [0.22, 1, 0.36, 1] }
                  : { type: "spring", stiffness: 460, damping: 34, mass: 0.72 }
              }
            />
          ) : null}

          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = hasActiveItem && index === activeIndex;

            return (
              <Link
                key={item.href}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                href={item.href}
                aria-label={item.label}
                onClick={() => setOptimisticActiveIndex(index)}
                className={cn(
                  "group relative z-20 flex h-full min-w-0 items-center justify-center rounded-[999px] px-[2px] py-0 transition-[color,background-color,transform] duration-[240ms] ease-out focus-visible:bg-white/[0.08]",
                  active && "pointer-events-none",
                )}
              >
                <motion.span
                  animate={{ scale: active ? 1.14 : 1, y: 0, opacity: active ? 0.98 : 0.76 }}
                  transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.65 }}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white/72 group-hover:text-white/88"
                >
                  <Icon size={18} strokeWidth={1.8} />
                </motion.span>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}
