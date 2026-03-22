"use client";

import { motion } from "framer-motion";
import { Moon, SunMedium } from "lucide-react";

import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/cn";

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
};

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Увімкнути темну тему" : "Увімкнути світлу тему"}
      className={cn(
        "app-shell-control inline-flex items-center justify-center rounded-full border text-app-primary transition-[color,background-color,border-color,transform,box-shadow] duration-fast hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-app-body active:translate-y-0",
        compact ? "h-10 w-10" : "h-11 w-11",
        className,
      )}
    >
      <motion.span
        key={theme}
        initial={{ opacity: 0, rotate: -18, scale: 0.9 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="inline-flex items-center justify-center"
      >
        {isLight ? <Moon size={compact ? 16 : 17} /> : <SunMedium size={compact ? 16 : 17} />}
      </motion.span>
    </button>
  );
}
