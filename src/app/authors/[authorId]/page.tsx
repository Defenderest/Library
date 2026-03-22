import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BookCard } from "@/components/books/book-card";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatUADate } from "@/lib/catalog/format";
import { getAuthorDetails } from "@/lib/catalog/queries";
import { resolveMediaPath } from "@/lib/media";

export const revalidate = 900;

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
  const detailsCards = [
    {
      label: "Країна",
      value: details.nationality || "-",
    },
    {
      label: "Дата народження",
      value: formatUADate(details.birthDate) || "-",
    },
    {
      label: "Книг у каталозі",
      value: String(details.books.length),
    },
  ];

  return (
    <section className="space-y-10">
      <div className="h-[46px] mobile:h-[70px]">
        <Link href="/authors" className="inline-flex items-center gap-s font-body text-sm text-app-primary transition duration-fast hover:text-app-secondary">
          <ArrowLeft size={16} />
          Назад
        </Link>
      </div>

      <GlassPanel className="app-detail-hero-surface relative overflow-hidden p-5 mobile:p-8">
        {portrait ? (
          <>
            <img
              src={portrait}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full scale-[1.22] object-cover opacity-[0.14] blur-[72px] saturate-[0.92] brightness-[0.42]"
            />
            <img
              src={portrait}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-[10%] top-[-8%] hidden h-[130%] w-[54%] object-cover opacity-[0.12] blur-[88px] saturate-[0.9] brightness-[0.42] compact:block"
            />
          </>
        ) : null}

        <div className="app-detail-hero-overlay pointer-events-none absolute inset-0" />
        <div className="app-detail-hero-specular pointer-events-none absolute inset-0" />
        <div className="app-detail-hero-bottom-fade pointer-events-none absolute inset-x-0 bottom-0 h-[42%]" />

        <div className="relative grid items-start gap-xl compact:grid-cols-[176px_minmax(0,1fr)] compact:items-center compact:gap-[48px]">
          <div className="mx-auto w-full max-w-[176px] compact:mx-0 compact:self-center">
            <div className="app-frame-surface relative overflow-hidden rounded-full border border-app-border-light p-2 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <div className="app-frame-inner-surface relative h-[160px] w-[160px] overflow-hidden rounded-full">
                {portrait ? (
                  <img
                    src={portrait}
                    alt={details.fullName}
                    className="h-full w-full object-cover brightness-[0.96] contrast-[1.04] saturate-[0.94]"
                  />
                ) : (
                  <div className="app-frame-inner-surface flex h-full w-full items-center justify-center font-display text-6xl text-app-secondary">
                    ?
                  </div>
                )}
              </div>
              <div className="pointer-events-none absolute inset-2 rounded-full border border-[color:var(--color-frame-inner-border)]" />
            </div>
          </div>

          <div className="min-w-0 max-w-[680px] space-y-6 pt-1 compact:pt-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="app-subtle-surface-strong rounded-pill border border-app-border-light px-4 py-2 font-body text-[10px] uppercase tracking-[0.12em] text-app-primary">
                {(details.nationality || "Без країни").toUpperCase()}
              </span>
              <span className="app-subtle-surface rounded-pill border border-app-border-light px-4 py-2 font-body text-[10px] uppercase tracking-[0.12em] text-app-primary">
                Автор каталогу
              </span>
            </div>

            <div className="space-y-2.5">
              <h2 className="max-w-[12ch] font-display text-[36px] leading-[1.04] text-app-primary mobile:text-[48px]">
                {details.fullName}
              </h2>
              <p className="font-body text-xs uppercase tracking-[0.16em] text-app-muted">
                Дата народження: {formatUADate(details.birthDate) || "Не вказано"}
              </p>
            </div>
          </div>
        </div>
      </GlassPanel>

      <div className="grid gap-s mobile:grid-cols-3">
        {detailsCards.map((card) => (
          <article
            key={card.label}
            className="app-subtle-surface rounded-soft border border-app-border-light p-m"
          >
            <p className="font-body text-[10px] uppercase tracking-[0.12em] text-app-muted">{card.label}</p>
            <p className="mt-2 break-words font-display text-[18px] leading-tight text-app-primary">
              {card.value}
            </p>
          </article>
        ))}
      </div>

      <section className="space-y-s">
        <h3 className="font-display text-2xl text-app-primary">Біографія</h3>
        <div className="app-subtle-surface rounded-soft border border-app-border-light p-l">
          <p className="font-body text-sm leading-relaxed text-app-secondary [text-align:justify]">
            {details.biography || "Біографія відсутня"}
          </p>
        </div>
      </section>

      <section className="space-y-m">
        <h3 className="font-display text-2xl text-app-primary">Книги автора</h3>

        {details.books.length === 0 ? (
          <p className="font-body text-sm text-app-secondary">Книги відсутні</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 mobile:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] mobile:gap-10">
            {details.books.map((book) => (
              <BookCard key={book.bookId} book={book} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
