"use client";

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

  const activeIndex = Math.max(
    0,
    navItems.findIndex((item) => isNavPathActive(pathname, item.href)),
  );

  const railRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const dragStartRef = useRef<{ pointerX: number; capsuleLeft: number } | null>(null);

  const [capsuleMetrics, setCapsuleMetrics] = useState<CapsuleMetrics>(EMPTY_METRICS);
  const [dragLeft, setDragLeft] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
  }, [activeIndex, isDragging, navItems.length]);

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

      let closestIndex = activeIndex;
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
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 pb-[calc(8px+env(safe-area-inset-bottom))] desktop:hidden">
      <nav className="relative w-[min(76vw,296px)] rounded-[999px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(18,18,20,0.34)_0%,rgba(10,10,12,0.46)_100%)] px-1.5 py-1.5 shadow-[0_8px_22px_rgba(0,0,0,0.18)] backdrop-blur-[24px]">
        <span className="pointer-events-none absolute inset-x-[14%] top-0 h-[1px] bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0)_100%)]" />
        <span className="pointer-events-none absolute inset-0 rounded-[999px] bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0)_52%,rgba(0,0,0,0.05)_100%)]" />

        <div
          ref={railRef}
          className="relative grid gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
          {capsuleMetrics.width > 0 ? (
            <button
              type="button"
              aria-label="Перетягнути активну вкладку"
              onPointerDown={startDrag}
              className={cn(
                "absolute inset-y-0 z-10 rounded-[999px] border border-white/[0.07] bg-[rgba(255,255,255,0.024)] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] backdrop-blur-[18px] touch-none",
                !isDragging && "transition-[transform,width] duration-[260ms] ease-out",
              )}
              style={{
                width: `${capsuleMetrics.width}px`,
                transform: `translateX(${capsuleLeft}px)`,
              }}
            />
          ) : null}

          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = index === activeIndex;

            return (
              <Link
                key={item.href}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                href={item.href}
                prefetch={false}
                aria-label={item.label}
                className={cn(
                  "group relative z-20 flex min-w-0 items-center justify-center rounded-[999px] px-1 py-[10px] transition duration-[240ms] ease-out",
                  active && "pointer-events-none",
                )}
              >
                <span
                  className={cn(
                    "relative inline-flex h-8 w-8 items-center justify-center rounded-full transition duration-[240ms] ease-out",
                    active ? "text-white/95" : "text-white/72 group-hover:text-white/88",
                  )}
                >
                  <Icon size={16} strokeWidth={1.8} />
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
