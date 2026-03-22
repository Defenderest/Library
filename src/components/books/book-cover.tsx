"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { resolveMediaPath } from "@/lib/media";

type BookCoverProps = {
  title: string;
  imagePath?: string;
  className?: string;
  imageClassName?: string;
  placeholderClassName?: string;
  sizes?: string;
  priority?: boolean;
};

export function BookCover({
  title,
  imagePath,
  className,
  imageClassName,
  placeholderClassName,
  sizes = "(max-width: 768px) 44vw, 280px",
  priority = false,
}: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSource = useMemo(() => resolveMediaPath(imagePath), [imagePath]);
  const isRemoteSource =
    resolvedSource?.startsWith("https://") || resolvedSource?.startsWith("http://") || false;

  return (
    <div className={cn("app-frame-inner-surface relative overflow-hidden", className)}>
      {resolvedSource && !failed ? (
        <Image
          src={resolvedSource}
          alt={title}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={isRemoteSource}
          className={cn("h-full w-full object-cover", imageClassName)}
          onError={() => setFailed(true)}
        />
      ) : null}

      {(!resolvedSource || failed) && (
        <div
          className={cn(
            "app-frame-inner-surface absolute inset-0 flex items-center justify-center border border-app-border-light font-display text-4xl text-app-secondary",
            placeholderClassName,
          )}
        >
          ?
        </div>
      )}
    </div>
  );
}
