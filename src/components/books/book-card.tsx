"use client";

import Link from "next/link";

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
  return (
    <article
      className={cn(
        "group relative flex h-full min-h-[520px] w-full flex-col overflow-hidden rounded-sharp border border-app-border-light bg-app-card p-5 transition-[transform,border-color,box-shadow,background-color] duration-[500ms] ease-out hover:-translate-y-[4px] hover:border-white/15 hover:bg-white/[0.015] hover:shadow-[0_24px_60px_rgba(0,0,0,0.42)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-sharp border border-white/0 transition duration-[500ms] group-hover:border-white/[0.05]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_46%)] opacity-0 transition duration-[500ms] group-hover:opacity-100" />

      <Link
        href={detailsHref}
        className="relative block overflow-hidden rounded-sharp bg-[linear-gradient(180deg,rgba(255,255,255,0.11)_0%,rgba(255,255,255,0.03)_100%)] p-px transition duration-[500ms] group-hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.06)_100%)]"
      >
        <div className="relative overflow-hidden rounded-[3px] bg-[#0a0a0a]">
          <BookCover
            title={book.title}
            imagePath={book.coverImagePath}
            className="aspect-[2/3] rounded-[3px]"
            imageClassName="transform-gpu brightness-[0.94] contrast-[1.03] saturate-[0.92] transition duration-[800ms] ease-out group-hover:scale-[1.028] group-hover:brightness-[1.01] group-hover:contrast-[1.01] group-hover:saturate-[0.98]"
          />

          <div className="pointer-events-none absolute inset-0 rounded-[3px] border border-white/8 transition duration-[500ms] group-hover:border-white/14" />
          <div className="pointer-events-none absolute inset-[8px] rounded-[2px] border border-white/0 transition duration-[500ms] group-hover:border-white/10" />
          <div className="pointer-events-none absolute inset-0 rounded-[3px] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(18,18,18,0.38)_100%)] transition duration-[500ms] group-hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(10,10,10,0.18)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[16%] bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0)_100%)] opacity-70 transition duration-[500ms] group-hover:opacity-90" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.3)_100%)] opacity-80 transition duration-[500ms] group-hover:opacity-55" />
        </div>
      </Link>

      <div className="relative mt-[25px] space-y-[5px]">
        <Link href={detailsHref} className="block">
          <h3 className="truncate font-display text-[20px] text-app-primary transition duration-[350ms] group-hover:text-white/95">
            {book.title}
          </h3>
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
