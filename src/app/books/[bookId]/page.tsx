import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BookCard } from "@/components/books/book-card";
import { BookCover } from "@/components/books/book-cover";
import { CommentItem } from "@/components/books/comment-item";
import { StarRating } from "@/components/books/star-rating";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
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

  return (
    <section className="space-y-10">
      <div className="h-[70px]">
        <Link href="/books" className="inline-flex items-center gap-s font-body text-sm text-app-primary transition duration-fast hover:text-app-secondary">
          <ArrowLeft size={16} />
          Назад
        </Link>
      </div>

      <div className="flex flex-col gap-xxl compact:flex-row">
        <div className="w-full max-w-[180px] flex-none">
          <BookCover title={details.title} imagePath={details.coverImagePath} className="h-[240px] rounded-sharp" />
        </div>

        <div className="min-w-0 flex-1 space-y-m">
          <h2 className="font-display text-[42px] leading-tight text-app-primary">{details.title}</h2>
          <p className="font-body text-xs uppercase tracking-[0.1em] text-app-muted">
            {(details.authors || "Невідомий автор").toUpperCase()}
          </p>

          <div className="flex flex-wrap items-center gap-l text-sm text-app-secondary">
            <p>Жанр: {details.genre || "-"}</p>
            <p>Мова: {details.language || "-"}</p>
          </div>

          <div className="flex items-center gap-m">
            <StarRating rating={details.averageRating} starSize="lg" />
            <span className="font-body text-sm text-app-secondary">{details.averageRating.toFixed(1)}</span>
          </div>

          <p className="font-display text-2xl text-app-primary">UAH {details.price.toFixed(2)}</p>

          <dl className="grid grid-cols-[auto_1fr] gap-x-l gap-y-s text-sm">
            <dt className="text-app-muted">Видавець:</dt>
            <dd className="text-app-secondary">{details.publisherName || "-"}</dd>

            <dt className="text-app-muted">Дата видання:</dt>
            <dd className="text-app-secondary">{formatUADate(details.publicationDate) || "-"}</dd>

            <dt className="text-app-muted">Сторінок:</dt>
            <dd className="text-app-secondary">{details.pageCount > 0 ? details.pageCount : "-"}</dd>

            <dt className="text-app-muted">ISBN:</dt>
            <dd className="text-app-secondary">{details.isbn || "-"}</dd>
          </dl>

          <div className="flex flex-wrap items-center gap-m">
            <AddToCartButton
              bookId={details.bookId}
              stockQuantity={details.stockQuantity}
              className="h-[46px] w-[240px]"
            />
            <span className={details.stockQuantity > 0 ? "text-app-success" : "text-app-error"}>
              {details.stockQuantity > 0 ? "В наявності" : "Немає на складі"}
            </span>
          </div>
        </div>
      </div>

      <section className="space-y-s">
        <h3 className="font-display text-2xl text-app-primary">Опис</h3>
        <p className="max-w-4xl font-body text-sm leading-relaxed text-app-secondary">
          {details.description || "Опис відсутній"}
        </p>
      </section>

      <section className="space-y-m">
        <div className="flex items-center gap-m">
          <h3 className="font-display text-2xl text-app-primary">Відгуки</h3>
          <div className="ml-auto">
            <p className="font-body text-[10px] uppercase tracking-[0.1em] text-app-muted">
              {details.comments.length > 0 ? `${details.comments.length} відгуків` : "Поки без відгуків"}
            </p>
          </div>
        </div>

        {details.comments.length === 0 ? (
          <p className="font-body text-sm text-app-secondary">Ще немає відгуків</p>
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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-10">
            {similarBooks.map((book) => (
              <BookCard key={book.bookId} book={book} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
