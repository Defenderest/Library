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
        "group block h-[280px] w-full rounded-sharp border border-app-border-light bg-app-card p-5 text-center transition-[transform,border-color,background-color,box-shadow] duration-normal hover:-translate-y-[5px] hover:border-app-border-hover hover:bg-white/[0.015] hover:shadow-[0_20px_48px_rgba(0,0,0,0.38)] focus-visible:-translate-y-[5px] focus-visible:border-app-border-hover focus-visible:bg-white/[0.015] focus-visible:shadow-[0_20px_48px_rgba(0,0,0,0.38)]",
        className,
      )}
    >
      <div className="mx-auto h-[120px] w-[120px] overflow-hidden rounded-full bg-[#111]">
        {imageSource ? (
          <img
            src={imageSource}
            alt={`${author.firstName} ${author.lastName}`}
            className="h-full w-full object-cover grayscale transition duration-slow group-hover:grayscale-0"
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
