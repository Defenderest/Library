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
      className={cn(
        "group relative flex h-full min-h-[520px] w-full flex-col overflow-hidden rounded-sharp border border-app-border-light bg-app-card p-5 transition duration-normal hover:-translate-y-[5px] hover:border-app-border-hover",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-smooth group-hover:opacity-100" style={spotlightStyle} />

      <Link href={detailsHref} className="relative block">
        <BookCover
          title={book.title}
          imagePath={book.coverImagePath}
          className="aspect-[2/3] rounded-sharp"
          imageClassName="grayscale transition duration-[1500ms] ease-out group-hover:scale-[1.05] group-hover:grayscale-0"
        />

        <div className="pointer-events-none absolute inset-0 rounded-sharp bg-[#555]/50 transition duration-[600ms] group-hover:bg-transparent" />
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
