"use client";

import Link from "next/link";
import { useMemo, useState, type MouseEvent } from "react";

import { BookCover } from "@/components/books/book-cover";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { cn } from "@/lib/cn";
import type { BookCardData } from "@/lib/catalog/types";

type BookCardProps = {
  book: BookCardData;
  detailsHref?: string;
  className?: string;
};

export function BookCard({ book, detailsHref = `/books/${book.bookId}`, className }: BookCardProps) {
  const [spotlight, setSpotlight] = useState({ x: 140, y: 160 });

  const spotlightStyle = useMemo(
    () => ({
      background: `radial-gradient(600px circle at ${spotlight.x}px ${spotlight.y}px, rgba(255,255,255,0.06), transparent 42%)`,
    }),
    [spotlight.x, spotlight.y],
  );

  const updateSpotlight = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSpotlight({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  return (
    <article
      onMouseMove={updateSpotlight}
      onMouseLeave={() => setSpotlight({ x: 140, y: 160 })}
      className={cn(
        "group relative flex h-full min-h-[520px] w-full flex-col overflow-hidden rounded-sharp border border-app-border-light bg-app-card p-5 transition duration-normal hover:-translate-y-[5px] hover:border-app-border-hover",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-smooth group-hover:opacity-100" style={spotlightStyle} />

      <Link href={detailsHref} className="relative block overflow-hidden rounded-sharp">
        <BookCover
          title={book.title}
          imagePath={book.coverImagePath}
          className="aspect-[2/3] rounded-sharp"
          imageClassName="transform-gpu brightness-[0.9] contrast-[1.08] saturate-[0.86] sepia-[0.16] transition duration-[1400ms] ease-out group-hover:scale-[1.06] group-hover:-translate-y-[2px] group-hover:rotate-[0.7deg] group-hover:brightness-100 group-hover:contrast-100 group-hover:saturate-100 group-hover:sepia-0"
        />

        <div className="pointer-events-none absolute inset-0 rounded-sharp bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(30,30,30,0.4)_100%)] transition duration-[500ms] group-hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(20,20,20,0.18)_100%)]" />

        <div className="pointer-events-none absolute inset-y-0 -left-[55%] w-[42%] -skew-x-[16deg] bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.24)_50%,rgba(255,255,255,0)_100%)] opacity-0 transition duration-[1100ms] ease-out group-hover:translate-x-[320%] group-hover:opacity-100" />
      </Link>

      <div className="relative mt-[25px] space-y-[5px]">
        <Link href={detailsHref} className="block">
          <h3 className="truncate font-display text-[20px] text-app-primary">{book.title}</h3>
        </Link>

        <p className="truncate font-body text-xs uppercase tracking-[0.08em] text-app-muted">
          {(book.authors || "Невідомий автор").toUpperCase()}
        </p>

        <p className="pt-[15px] font-display text-sm font-medium text-app-primary">
          UAH {book.price.toFixed(2)}
        </p>
      </div>

      <div className="relative mt-auto pt-[18px]">
        <AddToCartButton bookId={book.bookId} stockQuantity={book.stockQuantity} />
      </div>
    </article>
  );
}
