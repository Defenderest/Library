import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BookCardHome } from "@/components/books/book-card-home";
import { buttonStyles } from "@/components/ui/button";
import { getHomeNewArrivals } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function readStringParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const newArrivals = await getHomeNewArrivals(6);
  const infoMessage = readStringParam(searchParams?.message).trim();

  return (
    <div className="space-y-10">
      {infoMessage.length > 0 ? (
        <div className="rounded-soft border border-app-border-light bg-app-card px-m py-s">
          <p className="font-body text-sm text-app-secondary">{infoMessage}</p>
        </div>
      ) : null}

      <section className="relative min-h-[250px] overflow-hidden border-b border-app-border-light bg-[#111]" style={{ height: "min(400px, max(250px, 35vw))" }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.2),transparent_48%),linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(3,3,3,0.95)_100%)]" />
        <div className="absolute inset-0 bg-[rgba(3,3,3,0.55)]" />

        <div className="relative flex h-full flex-col justify-end px-[var(--spacing-xxl)] pb-[var(--spacing-xxl)]">
          <h2 className="font-display text-[32px] leading-none text-app-primary mobile:text-[44px] compact:text-[64px]">
            Естетика
          </h2>
          <h2 className="font-display text-[32px] leading-none text-app-primary mobile:text-[44px] compact:text-[64px]">
            Тиші.
          </h2>

          <p className="mt-m max-w-[400px] font-body text-sm font-light text-white/80">
            Лімітована колекція архітектурних та філософських видань.
          </p>

          <Link href="/books" className={buttonStyles("outline", "mt-m w-fit gap-s")}>
            Відкрити Каталог
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-3xl text-app-primary">Новинки Колекції</h3>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-10">
          {newArrivals.map((book) => (
            <BookCardHome key={book.bookId} book={book} className="w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
