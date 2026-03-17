"use client";

import Link from "next/link";
import { useMemo, useState, type MouseEvent } from "react";

import { BookCover } from "@/components/books/book-cover";
import { cn } from "@/lib/cn";
import type { BookCardData } from "@/lib/catalog/types";

type BookCardHomeProps = {
  book: BookCardData;
  href?: string;
  className?: string;
};

export function BookCardHome({ book, href = `/books/${book.bookId}`, className }: BookCardHomeProps) {
  const [spotlight, setSpotlight] = useState({ x: 120, y: 160 });

  const spotlightStyle = useMemo(
    () => ({
      background: `radial-gradient(420px circle at ${spotlight.x}px ${spotlight.y}px, rgba(255,255,255,0.12), transparent 44%)`,
    }),
    [spotlight.x, spotlight.y],
  );

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSpotlight({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  return (
    <Link
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setSpotlight({ x: 120, y: 160 })}
      className={cn(
        "group relative flex min-h-[520px] w-full flex-col overflow-hidden rounded-sharp border border-app-border-light bg-transparent p-m transition duration-normal hover:-translate-y-[4px] hover:border-app-border-hover",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-normal group-hover:opacity-100" style={spotlightStyle} />

      <div className="relative overflow-hidden rounded-sharp">
        <BookCover
          title={book.title}
          imagePath={book.coverImagePath}
          className="relative aspect-[2/3] rounded-sharp"
          imageClassName="transform-gpu brightness-[0.9] contrast-[1.08] saturate-[0.86] sepia-[0.16] transition duration-[1400ms] ease-out group-hover:scale-[1.045] group-hover:-translate-y-[2px] group-hover:rotate-[0.6deg] group-hover:brightness-100 group-hover:contrast-100 group-hover:saturate-100 group-hover:sepia-0"
        />

        <div className="pointer-events-none absolute inset-0 rounded-sharp bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(30,30,30,0.42)_100%)] transition duration-[500ms] group-hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(20,20,20,0.2)_100%)]" />

        <div className="pointer-events-none absolute inset-y-0 -left-[55%] w-[42%] -skew-x-[16deg] bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0)_100%)] opacity-0 transition duration-[1100ms] ease-out group-hover:translate-x-[320%] group-hover:opacity-100" />
      </div>

      <div className="relative mt-m space-y-1 pb-s">
        <h3 className="truncate font-display text-[20px] text-app-primary">{book.title}</h3>
        <p className="truncate font-body text-xs uppercase tracking-[0.08em] text-app-secondary">
          {(book.authors || "Невідомий автор").toUpperCase()}
        </p>
      </div>
    </Link>
  );
}
