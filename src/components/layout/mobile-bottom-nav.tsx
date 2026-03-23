"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

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

const snapToHalfPixel = (value: number): number => Math.round(value * 2) / 2;
const MOBILE_HIGHLIGHT_MAX_WIDTH = 50;

export function MobileBottomNav({ pathname, isAdmin }: MobileBottomNavProps) {
  const router = useRouter();
  const navItems = useMemo(
    () => APP_NAV_ITEMS.filter((item) => item.mobilePrimary && (!item.adminOnly || isAdmin)),
    [isAdmin],
  );

  const [optimisticActiveIndex, setOptimisticActiveIndex] = useState<number | null>(null);
  const [capsuleMetrics, setCapsuleMetrics] = useState<CapsuleMetrics>(EMPTY_METRICS);
  const [dragLeft, setDragLeft] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreviewIndex, setDragPreviewIndex] = useState<number | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchDirection, setSwitchDirection] = useState<1 | -1>(1);

  const matchedPathIndex = navItems.findIndex((item) => isNavPathActive(pathname, item.href));
  const activeIndex = optimisticActiveIndex ?? matchedPathIndex;
  const hasActiveItem = activeIndex >= 0;
  const visualActiveIndex = isDragging ? (dragPreviewIndex ?? activeIndex) : activeIndex;

  const railRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ pointerX: number; capsuleLeft: number } | null>(null);
  const dragLeftRef = useRef<number | null>(null);
  const previousActiveIndexRef = useRef<number>(activeIndex);

  useEffect(() => {
    setOptimisticActiveIndex(null);
    setDragPreviewIndex(null);
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
    }, 320);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeIndex, hasActiveItem]);

  const getCapsuleMetrics = useCallback(
    (index: number): CapsuleMetrics | null => {
      const railRect = railRef.current?.getBoundingClientRect();

      if (!railRect || navItems.length === 0) {
        return null;
      }

      const slotWidth = railRect.width / navItems.length;
      const iconOffsetX = navItems[index]?.mobileIconOffset?.x ?? 0;
      const targetWidth = Math.min(slotWidth - 14, MOBILE_HIGHLIGHT_MAX_WIDTH);
      const centerX = slotWidth * index + slotWidth / 2 + iconOffsetX;

      return {
        left: snapToHalfPixel(centerX - targetWidth / 2),
        width: snapToHalfPixel(targetWidth),
      };
    },
    [navItems],
  );

  useEffect(() => {
    const syncActiveCapsule = () => {
      if (isDragging) {
        return;
      }

      if (!hasActiveItem) {
        setCapsuleMetrics(EMPTY_METRICS);
        return;
      }

      const nextMetrics = getCapsuleMetrics(activeIndex);
      if (nextMetrics) {
        setCapsuleMetrics(nextMetrics);
      }
    };

    syncActiveCapsule();

    window.addEventListener("resize", syncActiveCapsule);
    return () => {
      window.removeEventListener("resize", syncActiveCapsule);
    };
  }, [activeIndex, getCapsuleMetrics, hasActiveItem, isDragging]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const metricsByIndex = navItems
      .map((_, index) => {
        const metrics = getCapsuleMetrics(index);
        return metrics ? { index, metrics } : null;
      })
      .filter((entry): entry is { index: number; metrics: CapsuleMetrics } => entry !== null);

    if (metricsByIndex.length === 0) {
      return;
    }

    const minLeft = Math.min(...metricsByIndex.map((entry) => entry.metrics.left));
    const maxLeft = Math.max(...metricsByIndex.map((entry) => entry.metrics.left));
    const widthForCenter = capsuleMetrics.width > 0 ? capsuleMetrics.width : metricsByIndex[0].metrics.width;

    const getClosestIndexFromLeft = (left: number) => {
      const center = left + widthForCenter / 2;
      let closestIndex = metricsByIndex[0].index;
      let closestDistance = Number.POSITIVE_INFINITY;

      metricsByIndex.forEach((entry) => {
        const itemCenter = entry.metrics.left + entry.metrics.width / 2;
        const distance = Math.abs(itemCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = entry.index;
        }
      });

      return closestIndex;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStartRef.current) {
        return;
      }

      const delta = event.clientX - dragStartRef.current.pointerX;
      const unclampedLeft = dragStartRef.current.capsuleLeft + delta;
      const nextLeft = Math.min(maxLeft, Math.max(minLeft, unclampedLeft));

      dragLeftRef.current = nextLeft;
      setDragLeft(nextLeft);

      const closestIndex = getClosestIndexFromLeft(nextLeft);
      setDragPreviewIndex((current) => (current === closestIndex ? current : closestIndex));
    };

    const finishDrag = () => {
      const currentLeft = dragLeftRef.current ?? capsuleMetrics.left;
      const closestIndex = getClosestIndexFromLeft(currentLeft);
      const snappedMetrics = metricsByIndex.find((entry) => entry.index === closestIndex)?.metrics;

      if (snappedMetrics) {
        setCapsuleMetrics(snappedMetrics);
      }

      setIsDragging(false);
      setDragLeft(null);
      setDragPreviewIndex(null);
      dragLeftRef.current = null;
      dragStartRef.current = null;
      document.body.style.userSelect = "";

      const nextItem = navItems[closestIndex];
      if (nextItem && nextItem.href !== pathname) {
        setOptimisticActiveIndex(closestIndex);
        router.push(nextItem.href);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      document.body.style.userSelect = "";
    };
  }, [capsuleMetrics.left, capsuleMetrics.width, getCapsuleMetrics, isDragging, navItems, pathname, router]);

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!hasActiveItem) {
      return;
    }

    const currentMetrics = getCapsuleMetrics(activeIndex);
    if (!currentMetrics) {
      return;
    }

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}

    dragStartRef.current = {
      pointerX: event.clientX,
      capsuleLeft: currentMetrics.left,
    };
    dragLeftRef.current = currentMetrics.left;

    setCapsuleMetrics(currentMetrics);
    setDragLeft(currentMetrics.left);
    setDragPreviewIndex(activeIndex);
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
        className="app-mobile-nav-panel relative h-[var(--mobile-bottom-nav-height)] w-full rounded-[999px] border px-[4px] py-[4px] backdrop-blur-[28px]"
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
              aria-label="Перетягнути повзунок навігації"
              onPointerDown={startDrag}
              className={cn(
                "app-mobile-nav-highlight absolute inset-y-[9px] left-0 z-10 overflow-hidden rounded-[999px] border backdrop-blur-[12px] touch-none",
                isDragging ? "cursor-grabbing" : "cursor-grab",
              )}
              animate={{
                x: capsuleLeft,
                width: capsuleMetrics.width,
                scale: isDragging ? 1.03 : isSwitching ? [1, 1.07, 1] : 1,
              }}
              transition={{
                x: { type: "spring", stiffness: 460, damping: 34, mass: 0.72 },
                width: { type: "spring", stiffness: 460, damping: 34, mass: 0.72 },
                scale: {
                  duration: isDragging ? 0.14 : isSwitching ? 0.34 : 0.2,
                  ease: [0.22, 1, 0.36, 1],
                },
              }}
            >
              <motion.span
                className="absolute inset-0 bg-[var(--color-mobile-nav-highlight-bg)]"
                animate={
                  isDragging
                    ? {
                        scaleX: 1.03,
                        scaleY: 0.97,
                        x: 0,
                      }
                    : isSwitching
                    ? {
                        scaleX: [1, 1.08, 1],
                        scaleY: [1, 0.97, 1],
                        x: [0, switchDirection * 2, 0],
                      }
                    : {
                        scaleX: 1,
                        scaleY: 1,
                        x: 0,
                      }
                }
                transition={{ duration: isSwitching ? 0.26 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: switchDirection === 1 ? "left center" : "right center" }}
              />
            </motion.button>
          ) : null}

          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = hasActiveItem && index === visualActiveIndex;

            return (
              <Link
                key={item.href}
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
                    scale: active ? 1.08 : 1,
                    y: 0,
                    opacity: active ? 0.94 : 0.74,
                    rotate: active && isSwitching ? [0, switchDirection * -3, switchDirection, 0] : 0,
                  }}
                  transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.65 }}
                  className={cn(
                    "relative inline-flex h-[46px] w-[46px] items-center justify-center rounded-full transition-colors duration-fast",
                    active ? "text-app-primary" : "text-app-secondary group-hover:text-app-primary",
                  )}
                >
                  <span
                    className="inline-flex items-center justify-center"
                    style={{ transform: `translate(${item.mobileIconOffset?.x ?? 0}px, ${item.mobileIconOffset?.y ?? 0}px)` }}
                  >
                    <Icon size={21} strokeWidth={1.8} />
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
