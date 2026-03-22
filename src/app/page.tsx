import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BookCover } from "@/components/books/book-cover";
import { BookCardHome } from "@/components/books/book-card-home";
import { buttonStyles } from "@/components/ui/button";
import { getHomeNewArrivals } from "@/lib/catalog/queries";

export const revalidate = 300;

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
  const heroBooks = newArrivals.slice(0, 3);

  return (
    <div className="space-y-10">
      {infoMessage.length > 0 ? (
        <div className="rounded-soft border border-app-border-light bg-app-card px-m py-s">
          <p className="font-body text-sm text-app-secondary">{infoMessage}</p>
        </div>
      ) : null}

      <section className="app-home-hero-surface relative min-h-[250px] overflow-hidden border-b border-app-border-light" style={{ height: "min(400px, max(250px, 35vw))" }}>
        <div className="app-home-hero-overlay absolute inset-0" />
        <div className="app-home-hero-underlay absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_26%,rgba(255,255,255,0.12),transparent_24%),radial-gradient(circle_at_82%_22%,rgba(255,255,255,0.06),transparent_20%),radial-gradient(circle_at_72%_74%,rgba(160,126,96,0.18),transparent_28%)]" />

        <div className="app-home-hero-mobile-mask pointer-events-none absolute inset-0 compact:hidden" />
        <div className="pointer-events-none absolute right-[-8%] top-[14%] h-[44%] w-[44%] rounded-full bg-[radial-gradient(circle,rgba(214,190,164,0.22)_0%,transparent_68%)] blur-[28px] compact:hidden" />

        <div className="pointer-events-none absolute inset-y-0 right-[4%] hidden w-[38%] max-w-[500px] items-end py-6 compact:flex">
          <div className="app-home-hero-side-frame relative h-full w-full overflow-hidden rounded-soft border shadow-glass">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,248,238,0.42),transparent_28%),radial-gradient(circle_at_82%_76%,rgba(92,66,48,0.26),transparent_30%),linear-gradient(135deg,rgba(255,248,238,0.32)_0%,rgba(218,199,178,0.18)_28%,rgba(52,40,33,0.16)_60%,rgba(18,15,13,0.54)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_26%,rgba(0,0,0,0.08)_100%)]" />

            {heroBooks[2] ? (
              <div className="absolute left-[12%] top-[18%] h-[56%] w-[30%] rotate-[-8deg] opacity-72 shadow-[0_22px_38px_rgba(0,0,0,0.18)]">
                <BookCover
                  title={heroBooks[2].title}
                  imagePath={heroBooks[2].coverImagePath}
                  className="h-full rounded-soft"
                  sizes="180px"
                />
              </div>
            ) : null}

            {heroBooks[1] ? (
              <div className="absolute left-[34%] top-[12%] h-[64%] w-[32%] rotate-[-2deg] shadow-[0_26px_44px_rgba(0,0,0,0.22)]">
                <BookCover
                  title={heroBooks[1].title}
                  imagePath={heroBooks[1].coverImagePath}
                  className="h-full rounded-soft"
                  sizes="190px"
                />
              </div>
            ) : null}

            {heroBooks[0] ? (
              <div className="absolute right-[12%] top-[15%] h-[68%] w-[34%] rotate-[7deg] shadow-[0_30px_52px_rgba(0,0,0,0.24)]">
                <BookCover
                  title={heroBooks[0].title}
                  imagePath={heroBooks[0].coverImagePath}
                  className="h-full rounded-soft"
                  sizes="200px"
                  priority
                />
              </div>
            ) : null}

            <div className="app-home-hero-side-overlay absolute inset-0" />
          </div>
        </div>

        <div className="relative flex h-full max-w-[620px] flex-col justify-end px-l pb-xl mobile:px-xxl mobile:pb-xxl">
          <h2 className="font-display text-[32px] leading-none text-app-primary mobile:text-[44px] compact:text-[64px]">
            Естетика
          </h2>
          <h2 className="font-display text-[32px] leading-none text-app-primary mobile:text-[44px] compact:text-[64px]">
            Тиші.
          </h2>

          <p className="app-home-hero-copy mt-m max-w-[400px] font-body text-sm font-light">
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

        <div className="grid grid-cols-2 gap-4 mobile:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] mobile:gap-10">
          {newArrivals.map((book) => (
            <BookCardHome key={book.bookId} book={book} className="w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
