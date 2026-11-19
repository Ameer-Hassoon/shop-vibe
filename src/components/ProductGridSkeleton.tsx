"use client";

import { useTranslations } from "next-intl";
import { ProductGridClasses } from "./ProductGrid";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  const t = useTranslations("common");
  return (
    <div role="status" aria-label={t("loading")} aria-busy="true" className={ProductGridClasses}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
        >
          <div className="aspect-[4/5] animate-pulse bg-surface-2" />
          <div className="space-y-3 p-3 sm:p-4">
            <div className="h-4 w-4/5 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-surface-2" />
            <div className="h-10 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
