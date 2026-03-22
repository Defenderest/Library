"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/cn";

type SteppedNumberFieldProps = {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
};

function getPrecision(step: number): number {
  const stepText = String(step);
  const decimalIndex = stepText.indexOf(".");
  return decimalIndex === -1 ? 0 : stepText.length - decimalIndex - 1;
}

function formatValue(value: number, precision: number): string {
  if (precision <= 0) {
    return String(Math.round(value));
  }

  return value.toFixed(precision);
}

export function SteppedNumberField({
  value,
  onChange,
  min,
  step = 1,
  placeholder,
  disabled = false,
  className,
  inputClassName,
}: SteppedNumberFieldProps) {
  const precision = getPrecision(step);

  const applyStep = (direction: 1 | -1) => {
    if (disabled) {
      return;
    }

    const parsedCurrent = Number(value);
    const fallbackBase = typeof min === "number" ? min : 0;
    const baseValue = Number.isFinite(parsedCurrent) ? parsedCurrent : fallbackBase;
    const nextValue = baseValue + direction * step;
    const clampedValue = typeof min === "number" ? Math.max(min, nextValue) : nextValue;

    onChange(formatValue(clampedValue, precision));
  };

  return (
    <div className={cn("relative", className)}>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        min={min}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        inputMode={precision > 0 ? "decimal" : "numeric"}
        className={cn(
          "app-number-input h-[42px] w-full rounded-sharp border border-app-border-light bg-transparent px-m pr-12 font-body text-sm text-app-primary outline-none transition duration-fast placeholder:text-app-muted focus:border-app-border-hover disabled:opacity-50",
          inputClassName,
        )}
      />

      <div className="absolute inset-y-1 right-1 flex w-9 flex-col gap-[3px]">
        <button
          type="button"
          onClick={() => applyStep(1)}
          disabled={disabled}
          aria-label="Збільшити значення"
          className="app-subtle-surface-soft inline-flex flex-1 items-center justify-center rounded-[10px] border border-app-border-light text-app-secondary transition duration-fast hover:border-app-border-hover hover:bg-app-hover hover:text-app-primary disabled:opacity-40"
        >
          <ChevronUp size={12} />
        </button>

        <button
          type="button"
          onClick={() => applyStep(-1)}
          disabled={disabled}
          aria-label="Зменшити значення"
          className="app-subtle-surface-soft inline-flex flex-1 items-center justify-center rounded-[10px] border border-app-border-light text-app-secondary transition duration-fast hover:border-app-border-hover hover:bg-app-hover hover:text-app-primary disabled:opacity-40"
        >
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  );
}
