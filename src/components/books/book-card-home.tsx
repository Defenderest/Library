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
      className={cn(
        "group relative block h-[500px] w-full overflow-hidden rounded-sharp border border-app-border-light bg-transparent p-m transition duration-normal hover:border-app-border-hover",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-normal group-hover:opacity-100" style={spotlightStyle} />

      <BookCover
        title={book.title}
        imagePath={book.coverImagePath}
        className="relative aspect-[2/3] rounded-sharp"
        imageClassName="grayscale transition duration-[1500ms] ease-out group-hover:scale-[1.02] group-hover:grayscale-0"
      />

      <div className="pointer-events-none absolute left-m right-m top-m aspect-[2/3] rounded-sharp bg-[#888]/40 transition duration-[400ms] group-hover:bg-transparent" />

      <div className="relative mt-m space-y-1">
        <h3 className="truncate font-display text-[20px] text-app-primary">{book.title}</h3>
        <p className="truncate font-body text-xs uppercase tracking-[0.08em] text-app-secondary">
          {(book.authors || "Невідомий автор").toUpperCase()}
        </p>
      </div>
    </Link>
  );
}
