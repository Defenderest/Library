"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { resolveMediaPath } from "@/lib/media";

type BookCoverProps = {
  title: string;
  imagePath?: string;
  className?: string;
  imageClassName?: string;
  placeholderClassName?: string;
};

export function BookCover({
  title,
  imagePath,
  className,
  imageClassName,
  placeholderClassName,
}: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSource = useMemo(() => resolveMediaPath(imagePath), [imagePath]);

  return (
    <div className={cn("relative overflow-hidden bg-[#111]", className)}>
      {resolvedSource && !failed ? (
        <img
          src={resolvedSource}
          alt={title}
          className={cn("h-full w-full object-cover", imageClassName)}
          onError={() => setFailed(true)}
        />
      ) : null}

      {(!resolvedSource || failed) && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center border border-app-border-light bg-[#111] font-display text-4xl text-app-secondary",
            placeholderClassName,
          )}
        >
          ?
        </div>
      )}
    </div>
  );
}
