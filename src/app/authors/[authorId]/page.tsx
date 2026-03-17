import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BookCard } from "@/components/books/book-card";
import { formatUADate } from "@/lib/catalog/format";
import { getAuthorDetails } from "@/lib/catalog/queries";
import { resolveMediaPath } from "@/lib/media";

export const dynamic = "force-dynamic";

type AuthorDetailsPageProps = {
  params?: {
    authorId: string;
  };
};

export default async function AuthorDetailsPage({ params }: AuthorDetailsPageProps) {
  const parsedAuthorId = Number(params?.authorId ?? "");

  if (!Number.isFinite(parsedAuthorId) || parsedAuthorId <= 0) {
    return (
      <section className="space-y-8">
        <Link href="/authors" className="inline-flex items-center gap-s font-body text-sm text-app-primary">
          <ArrowLeft size={16} />
          Назад
        </Link>

        <div className="rounded-soft border border-app-border-light bg-app-card p-8 text-center">
          <p className="font-display text-3xl text-app-primary">Автора не знайдено</p>
          <p className="mt-2 font-body text-sm text-app-secondary">Перейдіть до загального списку авторів.</p>
        </div>
      </section>
    );
  }

  const details = await getAuthorDetails(parsedAuthorId);

  if (!details) {
    return (
      <section className="space-y-8">
        <Link href="/authors" className="inline-flex items-center gap-s font-body text-sm text-app-primary">
          <ArrowLeft size={16} />
          Назад
        </Link>

        <div className="rounded-soft border border-app-border-light bg-app-card p-8 text-center">
          <p className="font-display text-3xl text-app-primary">Автора не знайдено</p>
          <p className="mt-2 font-body text-sm text-app-secondary">Перейдіть до загального списку авторів.</p>
        </div>
      </section>
    );
  }

  const portrait = resolveMediaPath(details.imagePath);

  return (
    <section className="space-y-10">
      <div className="h-[70px]">
        <Link href="/authors" className="inline-flex items-center gap-s font-body text-sm text-app-primary transition duration-fast hover:text-app-secondary">
          <ArrowLeft size={16} />
          Назад
        </Link>
      </div>

      <div className="flex flex-col gap-xxl compact:flex-row">
        <div className="h-[120px] w-[120px] flex-none overflow-hidden rounded-full bg-[#111]">
          {portrait ? (
            <img src={portrait} alt={details.fullName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#111] font-display text-6xl text-app-secondary">
              ?
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-m">
          <h2 className="font-display text-[42px] leading-tight text-app-primary">{details.fullName}</h2>
          <p className="font-body text-xs uppercase tracking-[0.1em] text-app-muted">
            {(details.nationality || "").toUpperCase()}
          </p>
          <p className="font-body text-sm text-app-secondary">
            Дата народження: {formatUADate(details.birthDate) || "-"}
          </p>
        </div>
      </div>

      <section className="space-y-s">
        <h3 className="font-display text-2xl text-app-primary">Біографія</h3>
        <p className="max-w-4xl font-body text-sm leading-relaxed text-app-secondary">
          {details.biography || "Біографія відсутня"}
        </p>
      </section>

      <section className="space-y-m">
        <h3 className="font-display text-2xl text-app-primary">Книги автора</h3>

        {details.books.length === 0 ? (
          <p className="font-body text-sm text-app-secondary">Книги відсутні</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-10">
            {details.books.map((book) => (
              <BookCard key={book.bookId} book={book} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
