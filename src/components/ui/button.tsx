import { cn } from "@/lib/cn";

type ButtonVariant = "outline" | "solid";

const BASE =
  "inline-flex h-11 items-center justify-center rounded-pill border px-6 font-body text-[11px] font-medium uppercase tracking-[0.2em] transition duration-fast";

const VARIANT: Record<ButtonVariant, string> = {
  outline:
    "border-app-border-light bg-transparent text-app-primary hover:border-app-border-hover hover:bg-app-hover",
  solid: "border-app-white bg-app-white text-app-body hover:opacity-90",
};

export function buttonStyles(variant: ButtonVariant = "outline", className?: string): string {
  return cn(BASE, VARIANT[variant], className);
}
