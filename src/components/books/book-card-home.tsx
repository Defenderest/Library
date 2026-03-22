"use client";

import Link from "next/link";

import { BookCover } from "@/components/books/book-cover";
import { cn } from "@/lib/cn";
import type { BookCardData } from "@/lib/catalog/types";

type BookCardHomeProps = {
  book: BookCardData;
  href?: string;
  className?: string;
};

export function BookCardHome({ book, href = `/books/${book.bookId}`, className }: BookCardHomeProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-[320px] w-full flex-col overflow-hidden rounded-sharp border border-app-border-light bg-app-card p-3 transition-[transform,border-color,box-shadow,background-color] duration-[500ms] ease-out hover:-translate-y-[4px] hover:border-app-border-hover hover:bg-app-hover hover:shadow-[var(--shadow-card-hover)] focus-within:-translate-y-[4px] focus-within:border-app-border-hover focus-within:bg-app-hover focus-within:shadow-[var(--shadow-card-hover)] mobile:min-h-[520px] mobile:p-m",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-sharp border border-transparent transition duration-[500ms] group-hover:border-app-border-hover/40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--color-card-top-glow),transparent_44%)] opacity-0 transition duration-[500ms] group-hover:opacity-100" />

      <div className="relative overflow-hidden rounded-sharp bg-[linear-gradient(180deg,var(--color-card-top-glow-strong)_0%,transparent_100%)] p-px transition duration-[500ms] group-hover:bg-[linear-gradient(180deg,var(--color-card-top-glow-strong)_0%,var(--color-surface-subtle)_100%)]">
        <div className="app-frame-inner-surface relative overflow-hidden rounded-[3px]">
          <BookCover
            title={book.title}
            imagePath={book.coverImagePath}
            className="relative aspect-[2/3] rounded-[3px]"
            imageClassName="transform-gpu brightness-[0.94] contrast-[1.03] saturate-[0.92] transition duration-[800ms] ease-out group-hover:scale-[1.024] group-hover:brightness-[1.01] group-hover:contrast-[1.01] group-hover:saturate-[0.98]"
          />

          <div className="pointer-events-none absolute inset-0 rounded-[3px] border border-[color:var(--color-frame-inner-border)] transition duration-[500ms] group-hover:border-app-border-hover/80" />
          <div className="pointer-events-none absolute inset-[8px] rounded-[2px] border border-transparent transition duration-[500ms] group-hover:border-app-border-hover/35" />
          <div className="pointer-events-none absolute inset-0 rounded-[3px] bg-[var(--color-card-image-fade)] transition duration-[500ms] group-hover:bg-[var(--color-card-image-fade-hover)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[16%] bg-[linear-gradient(180deg,var(--color-card-top-glow)_0%,transparent_100%)] opacity-70 transition duration-[500ms] group-hover:opacity-90" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-[var(--color-card-bottom-fade)] opacity-80 transition duration-[500ms] group-hover:opacity-55" />
        </div>
      </div>

      <div className="relative mt-3 space-y-1 pb-1 mobile:mt-m mobile:pb-s">
        <h3 className="min-h-[40px] overflow-hidden font-display text-[16px] leading-tight text-app-primary transition duration-[350ms] group-hover:text-app-primary [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] mobile:min-h-[50px] mobile:text-[20px]">
          {book.title}
        </h3>
        <p className="truncate font-body text-[10px] uppercase tracking-[0.08em] text-app-secondary mobile:text-xs">
          {(book.authors || "Невідомий автор").toUpperCase()}
        </p>
      </div>
    </Link>
  );
}
