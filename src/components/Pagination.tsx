"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { ChevronEndIcon, ChevronStartIcon } from "./icons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Page numbers with ellipses: 1 … 4 5 6 … 20 */
function pageList(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const btn =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-[var(--radius-control)] border px-3 text-sm font-medium tabular transition-colors";

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const t = useTranslations("common");

  return (
    <nav aria-label={t("pagination")} className="mt-10 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        aria-label={t("previous")}
        className={cn(btn, "border-line bg-surface text-fg hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40")}
      >
        <ChevronStartIcon className="h-4 w-4" />
      </button>
      {pageList(currentPage, totalPages).map((page, i) =>
        page === "gap" ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-subtle">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={t("pageN", { page })}
            className={cn(
              btn,
              page === currentPage
                ? "border-brand bg-brand text-brand-fg"
                : "border-line bg-surface text-fg hover:bg-surface-2",
            )}
          >
            {page}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        aria-label={t("next")}
        className={cn(btn, "border-line bg-surface text-fg hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40")}
      >
        <ChevronEndIcon className="h-4 w-4" />
      </button>
    </nav>
  );
}
