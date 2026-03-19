import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BookCard } from "@/components/books/book-card";
import { BookCover } from "@/components/books/book-cover";
import { CommentItem } from "@/components/books/comment-item";
import { BookReviewForm } from "@/components/books/book-review-form";
import { StarRating } from "@/components/books/star-rating";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatUADate } from "@/lib/catalog/format";
import { getBookDetails, getSimilarBooks } from "@/lib/catalog/queries";
import { resolveMediaPath } from "@/lib/media";

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
  const coverAmbientSource = resolveMediaPath(details.coverImagePath);
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
        {coverAmbientSource ? (
          <>
            <img
              src={coverAmbientSource}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full scale-[1.22] object-cover opacity-[0.16] blur-[70px] saturate-[1.35] brightness-[0.42]"
            />
            <img
              src={coverAmbientSource}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-[10%] top-[-8%] hidden h-[130%] w-[58%] object-cover opacity-[0.18] blur-[88px] saturate-[1.45] brightness-[0.46] compact:block"
            />
          </>
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(4,4,6,0.92)_0%,rgba(8,6,9,0.8)_22%,rgba(7,5,10,0.76)_46%,rgba(15,9,8,0.78)_68%,rgba(22,12,8,0.86)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_26%,rgba(92,38,22,0.18),transparent_26%),radial-gradient(circle_at_32%_54%,rgba(148,38,24,0.14),transparent_24%),radial-gradient(circle_at_74%_28%,rgba(210,166,134,0.08),transparent_22%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.06),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(4,4,4,0.46)_100%)]" />

        <div className="relative grid items-start gap-xl compact:grid-cols-[228px_minmax(0,1fr)] compact:items-center compact:gap-[56px]">
          <div className="mx-auto w-full max-w-[228px] compact:mx-0 compact:self-center">
            <div className="relative overflow-hidden rounded-soft border border-app-border-light bg-[#0f0f0f] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.34)]">
              <BookCover
                title={details.title}
                imagePath={details.coverImagePath}
                className="h-[300px] rounded-sharp mobile:h-[340px] compact:h-[368px]"
                imageClassName="brightness-[0.94] contrast-[1.06] saturate-[0.9] sepia-[0.12]"
              />
              <div className="pointer-events-none absolute inset-2 rounded-sharp border border-white/10" />
            </div>
          </div>

          <div className="min-w-0 max-w-[640px] space-y-6 pt-1 compact:pt-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-pill border border-app-border-light bg-white/[0.04] px-4 py-2 font-body text-[10px] uppercase tracking-[0.12em] text-app-primary">
                {details.genre || "Без жанру"}
              </span>
              <span className="rounded-pill border border-app-border-light bg-white/[0.03] px-4 py-2 font-body text-[10px] uppercase tracking-[0.12em] text-app-primary">
                {details.language || "Мова не вказана"}
              </span>
            </div>

            <div className="space-y-2.5">
              <h2 className="max-w-[14ch] font-display text-[34px] leading-[1.04] text-app-primary mobile:text-[46px]">
                {details.title}
              </h2>
              <p className="font-body text-xs uppercase tracking-[0.16em] text-app-muted">
                {(details.authors || "Невідомий автор").toUpperCase()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
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

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <p className="font-display text-[34px] leading-none text-app-primary mobile:text-[38px]">
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

            <div className="flex flex-col gap-3 pt-1 mobile:flex-row mobile:items-center mobile:gap-4">
              <AddToCartButton
                bookId={details.bookId}
                stockQuantity={details.stockQuantity}
                className="h-[48px] w-full mobile:w-[260px]"
              />
              <p className="shrink-0 font-body text-xs leading-none text-app-secondary">
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
            className="min-h-[88px] rounded-soft border border-app-border-light bg-white/[0.02] p-m"
          >
            <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">{card.label}</p>
            <p className="mt-2 break-words font-display text-[18px] leading-tight text-app-primary">
              {card.value}
            </p>
          </article>
        ))}
      </div>

      <section className="space-y-s">
        <h3 className="font-display text-2xl text-app-primary">Опис</h3>
        <div className="rounded-soft border border-app-border-light bg-white/[0.02] p-l">
          <p className="font-body text-sm leading-relaxed text-app-secondary [text-align:justify]">
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

        <BookReviewForm bookId={details.bookId} />

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
