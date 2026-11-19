"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

/** − / value / + control. Bounded to 1..max; the value is announced politely to screen readers. */
export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  className,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  label: string;
  className?: string;
}) {
  const t = useTranslations("cart");
  const btn =
    "flex h-10 w-10 items-center justify-center text-lg text-fg transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40";
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center overflow-hidden rounded-[var(--radius-control)] border border-line-strong bg-surface", className)}
    >
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={t("decreaseQuantity")}>
        <span aria-hidden>−</span>
      </button>
      <output aria-live="polite" className="tabular w-10 text-center text-sm font-semibold">
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={t("increaseQuantity")}>
        <span aria-hidden>+</span>
      </button>
    </div>
  );
}
