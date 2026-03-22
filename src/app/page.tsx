import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

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

        <div className="pointer-events-none absolute inset-0 compact:hidden">
          <Image
            src="/images/estetika-tyshi-hero.svg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-35"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,3,3,0.8)_15%,rgba(3,3,3,0.35)_100%)]" />
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-[4%] hidden w-[38%] max-w-[500px] items-end py-6 compact:flex">
          <div className="relative h-full w-full overflow-hidden rounded-soft border border-white/15 bg-black/30 shadow-glass">
            <Image
              src="/images/estetika-tyshi-hero.svg"
              alt="Мінімалістична ілюстрація книжкової естетики"
              fill
              sizes="(min-width: 1100px) 500px, 0px"
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,3,0.06)_0%,rgba(3,3,3,0.4)_100%)]" />
          </div>
        </div>

        <div className="relative flex h-full max-w-[620px] flex-col justify-end px-l pb-xl mobile:px-xxl mobile:pb-xxl">
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

        <div className="grid grid-cols-2 gap-4 mobile:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] mobile:gap-10">
          {newArrivals.map((book) => (
            <BookCardHome key={book.bookId} book={book} className="w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
