import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BookCard } from "@/components/books/book-card";
import { BookCover } from "@/components/books/book-cover";
import { CommentItem } from "@/components/books/comment-item";
import { StarRating } from "@/components/books/star-rating";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatUADate } from "@/lib/catalog/format";
import { getBookDetails, getSimilarBooks } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

type BookDetailsPageProps = {
  params?: {
    bookId: string;
  };
};

export default async function BookDetailsPage({ params }: BookDetailsPageProps) {
  const parsedBookId = Number(params?.bookId ?? "");

  if (!Number.isFinite(parsedBookId) || parsedBookId <= 0) {
    return (
      <section className="space-y-8">
        <Link href="/books" className="inline-flex items-center gap-s font-body text-sm text-app-primary">
          <ArrowLeft size={16} />
          Назад
        </Link>

        <div className="rounded-soft border border-app-border-light bg-app-card p-8 text-center">
          <p className="font-display text-3xl text-app-primary">Книгу не знайдено</p>
          <p className="mt-2 font-body text-sm text-app-secondary">
            Оберіть іншу позицію у каталозі.
          </p>
        </div>
      </section>
    );
  }

  const details = await getBookDetails(parsedBookId);

  if (!details) {
    return (
      <section className="space-y-8">
        <Link href="/books" className="inline-flex items-center gap-s font-body text-sm text-app-primary">
          <ArrowLeft size={16} />
          Назад
        </Link>

        <div className="rounded-soft border border-app-border-light bg-app-card p-8 text-center">
          <p className="font-display text-3xl text-app-primary">Книгу не знайдено</p>
          <p className="mt-2 font-body text-sm text-app-secondary">
            Оберіть іншу позицію у каталозі.
          </p>
        </div>
      </section>
    );
  }

  const similarBooks = await getSimilarBooks(details.bookId, details.genre, 5);
  const stockAvailable = details.stockQuantity > 0;
  const detailsCards = [
    {
      label: "Видавець",
      value: details.publisherName || "-",
    },
    {
      label: "Дата видання",
      value: formatUADate(details.publicationDate) || "-",
    },
    {
      label: "Сторінок",
      value: details.pageCount > 0 ? String(details.pageCount) : "-",
    },
    {
      label: "ISBN",
      value: details.isbn || "-",
    },
  ];

  return (
    <section className="space-y-10">
      <div className="h-[46px] mobile:h-[70px]">
        <Link href="/books" className="inline-flex items-center gap-s font-body text-sm text-app-primary transition duration-fast hover:text-app-secondary">
          <ArrowLeft size={16} />
          Назад
        </Link>
      </div>

      <GlassPanel className="relative overflow-hidden p-5 mobile:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.14),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(4,4,4,0.36)_100%)]" />

        <div className="relative grid gap-xl compact:grid-cols-[220px_1fr] compact:gap-xxl">
          <div className="mx-auto w-full max-w-[220px] compact:mx-0">
            <div className="relative overflow-hidden rounded-soft border border-app-border-light bg-[#0f0f0f] p-2">
              <BookCover
                title={details.title}
                imagePath={details.coverImagePath}
                className="h-[300px] rounded-sharp mobile:h-[340px] compact:h-[360px]"
                imageClassName="brightness-[0.94] contrast-[1.06] saturate-[0.9] sepia-[0.12]"
              />
              <div className="pointer-events-none absolute inset-2 rounded-sharp border border-white/10" />
            </div>
          </div>

          <div className="min-w-0 space-y-l">
            <div className="flex flex-wrap gap-s">
              <span className="rounded-pill border border-app-border-light bg-white/[0.04] px-4 py-2 font-body text-[10px] uppercase tracking-[0.12em] text-app-primary">
                {details.genre || "Без жанру"}
              </span>
              <span className="rounded-pill border border-app-border-light bg-white/[0.03] px-4 py-2 font-body text-[10px] uppercase tracking-[0.12em] text-app-secondary">
                {details.language || "Мова не вказана"}
              </span>
            </div>

            <div className="space-y-s">
              <h2 className="font-display text-[34px] leading-tight text-app-primary mobile:text-[46px]">
                {details.title}
              </h2>
              <p className="font-body text-xs uppercase tracking-[0.14em] text-app-muted">
                {(details.authors || "Невідомий автор").toUpperCase()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-m">
              <div className="inline-flex items-center gap-s rounded-pill border border-app-border-light bg-white/[0.04] px-m py-2">
                <StarRating rating={details.averageRating} starSize="lg" />
                <span className="font-body text-sm text-app-primary">{details.averageRating.toFixed(1)}</span>
              </div>

              <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">
                {details.comments.length > 0
                  ? `${details.comments.length} відгуків`
                  : "Поки без відгуків"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-m">
              <p className="font-display text-[34px] text-app-primary mobile:text-[38px]">
                UAH {details.price.toFixed(2)}
              </p>
              <span
                className={`rounded-pill border px-4 py-2 font-body text-[10px] uppercase tracking-[0.1em] ${
                  stockAvailable
                    ? "border-app-success/50 bg-app-success/10 text-app-success"
                    : "border-app-error/50 bg-app-error/10 text-app-error"
                }`}
              >
                {stockAvailable ? "В наявності" : "Немає на складі"}
              </span>
            </div>

            <div className="flex flex-col gap-s mobile:flex-row mobile:items-center">
              <AddToCartButton
                bookId={details.bookId}
                stockQuantity={details.stockQuantity}
                className="h-[48px] w-full mobile:w-[260px]"
              />
              <p className="font-body text-xs text-app-secondary">
                Доступно зараз: {Math.max(details.stockQuantity, 0)} шт.
              </p>
            </div>
          </div>
        </div>
      </GlassPanel>

      <div className="grid gap-s mobile:grid-cols-2 compact:grid-cols-4">
        {detailsCards.map((card) => (
          <article
            key={card.label}
            className="rounded-soft border border-app-border-light bg-white/[0.02] p-m"
          >
            <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">{card.label}</p>
            <p className="mt-2 truncate font-display text-[18px] text-app-primary">{card.value}</p>
          </article>
        ))}
      </div>

      <section className="space-y-s">
        <h3 className="font-display text-2xl text-app-primary">Опис</h3>
        <div className="rounded-soft border border-app-border-light bg-white/[0.02] p-l">
          <p className="max-w-4xl font-body text-sm leading-relaxed text-app-secondary">
            {details.description || "Опис відсутній"}
          </p>
        </div>
      </section>

      <section className="space-y-m">
        <div className="flex flex-wrap items-center gap-m">
          <h3 className="font-display text-2xl text-app-primary">Відгуки</h3>
          <p className="font-body text-[10px] uppercase tracking-[0.1em] text-app-muted mobile:ml-auto">
            {details.comments.length > 0 ? `${details.comments.length} відгуків` : "Поки без відгуків"}
          </p>
        </div>

        {details.comments.length === 0 ? (
          <div className="rounded-soft border border-app-border-light bg-white/[0.02] p-m">
            <p className="font-body text-sm text-app-secondary">Ще немає відгуків</p>
          </div>
        ) : (
          <div className="space-y-m">
            {details.comments.map((comment, index) => (
              <CommentItem key={`${comment.authorName}-${comment.commentDate}-${index}`} comment={comment} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-m">
        <h3 className="font-display text-2xl text-app-primary">Схожі книги</h3>

        {similarBooks.length === 0 ? (
          <p className="font-body text-sm text-app-secondary">Схожих книг поки немає</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 mobile:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] mobile:gap-10">
            {similarBooks.map((book) => (
              <BookCard key={book.bookId} book={book} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
