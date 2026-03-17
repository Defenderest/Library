import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function GlassPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-soft border border-app-border-light bg-app-glass shadow-glass backdrop-blur-[20px]",
        className,
      )}
      {...props}
    />
  );
}
