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
  const previousActiveIndexRef = useRef<number>(activeIndex);

  const [capsuleMetrics, setCapsuleMetrics] = useState<CapsuleMetrics>(EMPTY_METRICS);
  const [dragLeft, setDragLeft] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchDirection, setSwitchDirection] = useState<1 | -1>(1);

  useEffect(() => {
    setOptimisticActiveIndex(null);
  }, [pathname]);

  useEffect(() => {
    if (!hasActiveItem) {
      return;
    }

    const previousIndex = previousActiveIndexRef.current;
    if (previousIndex < 0 || previousIndex === activeIndex) {
      previousActiveIndexRef.current = activeIndex;
      return;
    }

    setSwitchDirection(activeIndex > previousIndex ? 1 : -1);
    previousActiveIndexRef.current = activeIndex;

    setIsSwitching(true);
    const timeoutId = window.setTimeout(() => {
      setIsSwitching(false);
    }, 260);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeIndex, hasActiveItem]);

  const getItemMetrics = (index: number): CapsuleMetrics | null => {
    const railRect = railRef.current?.getBoundingClientRect();
    const itemRect = itemRefs.current[index]?.getBoundingClientRect();

    if (!railRect || !itemRect) {
      return null;
    }

    const itemLeft = itemRect.left - railRect.left;
    const itemCenter = itemLeft + itemRect.width / 2;
    const targetWidth = Math.min(itemRect.width - 10, 52);

    return {
      left: itemCenter - targetWidth / 2,
      width: targetWidth,
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
  const dragDelta = dragStartRef.current ? capsuleLeft - dragStartRef.current.capsuleLeft : 0;
  const dragIntensity = Math.min(Math.abs(dragDelta) / 40, 1);

  return (
    <div className="mobile-bottom-nav-shell z-40 transition-[opacity,transform] duration-fast desktop:hidden">
      <motion.nav
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{
          opacity: 1,
          y: isDragging ? -1 : 0,
          scaleX: isDragging ? 1.05 : 1,
          scaleY: isDragging ? 1.04 : 1,
        }}
        transition={
          isDragging
            ? { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0.34, ease: [0.22, 1, 0.36, 1] }
        }
        className="app-mobile-nav-panel relative h-[var(--mobile-bottom-nav-height)] w-full rounded-[999px] border px-[5px] py-[5px] backdrop-blur-[28px]"
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
                "app-mobile-nav-highlight absolute inset-y-[4px] left-0 z-10 overflow-hidden rounded-[999px] border backdrop-blur-[18px] touch-none",
                isDragging && "cursor-grabbing",
              )}
              animate={{
                x: capsuleLeft,
                width: capsuleMetrics.width,
                scale: isDragging ? 1.06 + dragIntensity * 0.03 : isSwitching ? 1.04 : 1,
              }}
              transition={
                isDragging
                  ? { duration: 0.12, ease: [0.22, 1, 0.36, 1] }
                  : { type: "spring", stiffness: 460, damping: 34, mass: 0.72 }
              }
            >
              <span className="absolute inset-0 bg-[var(--color-mobile-nav-highlight-bg)]" />
              <span className="pointer-events-none absolute inset-x-[18%] top-0 h-[1px] bg-[linear-gradient(90deg,transparent_0%,var(--color-card-top-glow)_50%,transparent_100%)] opacity-75" />
            </motion.button>
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
                  "group relative z-20 flex h-full min-w-0 items-center justify-center rounded-[999px] px-[2px] py-0 transition-[color,background-color,transform] duration-[240ms] ease-out focus-visible:bg-app-hover",
                  active && "pointer-events-none",
                )}
              >
                <motion.span
                  animate={{
                    scale: active ? 1.14 : 1,
                    y: 0,
                    opacity: active ? 0.98 : 0.76,
                    rotate: active && isSwitching ? [0, switchDirection * -6, switchDirection * 2, 0] : 0,
                  }}
                  transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.65 }}
                  className={cn(
                    "relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-fast",
                    active ? "text-app-primary" : "text-app-secondary group-hover:text-app-primary",
                  )}
                >
                  <span
                    className="inline-flex items-center justify-center"
                    style={{ transform: `translate(${item.mobileIconOffset?.x ?? 0}px, ${item.mobileIconOffset?.y ?? 0}px)` }}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                  </span>
                </motion.span>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}
