import Link from "next/link";

import { cn } from "@/lib/cn";
import type { AuthorCardData } from "@/lib/catalog/types";
import { resolveMediaPath } from "@/lib/media";

type AuthorCardProps = {
  author: AuthorCardData;
  href?: string;
  className?: string;
};

export function AuthorCard({ author, href = `/authors/${author.authorId}`, className }: AuthorCardProps) {
  const imageSource = resolveMediaPath(author.imagePath);

  return (
    <Link
      href={href}
      className={cn(
        "group relative block h-[280px] w-full overflow-hidden rounded-sharp border border-app-border-light bg-app-card p-5 text-center transition-[transform,border-color,background-color,box-shadow] duration-normal hover:-translate-y-[5px] hover:border-app-border-hover hover:bg-white/[0.015] hover:shadow-[0_20px_48px_rgba(0,0,0,0.38)] focus-visible:-translate-y-[5px] focus-visible:border-app-border-hover focus-visible:bg-white/[0.015] focus-visible:shadow-[0_20px_48px_rgba(0,0,0,0.38)]",
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0)_100%)] opacity-0 transition duration-slow group-hover:opacity-100" />

      <div className="relative mx-auto h-[120px] w-[120px] overflow-hidden rounded-full border border-white/[0.08] bg-[#111] shadow-[0_12px_24px_rgba(0,0,0,0.24)] transition-[transform,border-color,box-shadow] duration-slow group-hover:-translate-y-[3px] group-hover:border-white/[0.14] group-hover:shadow-[0_18px_34px_rgba(0,0,0,0.32)]">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.14),transparent_34%)] opacity-70" />
        {imageSource ? (
          <img
            src={imageSource}
            alt={`${author.firstName} ${author.lastName}`}
            className="h-full w-full object-cover transition-[transform,filter] duration-slow group-hover:scale-[1.05] group-hover:brightness-[1.04] group-hover:contrast-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#111] font-display text-4xl text-app-secondary">
            ?
          </div>
        )}
      </div>

      <div className="mt-5 space-y-1">
        <h3 className="overflow-hidden font-display text-[20px] leading-tight text-app-primary [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {author.firstName} {author.lastName}
        </h3>
        <p className="truncate font-body text-xs uppercase tracking-[0.08em] text-app-muted">
          {(author.nationality || "").toUpperCase()}
          {author.nationality ? " • AUTHOR" : "AUTHOR"}
        </p>
      </div>
    </Link>
  );
}
