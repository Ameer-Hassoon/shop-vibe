"use client";

import { useTranslations } from "next-intl";
import { useFilters, MAX_PRICE } from "@/store/filters";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui";
import { DualRangeSlider } from "./DualRangeSlider";
import { StarRating } from "./StarRating";
import { useCategories, useCategoryLabel } from "./categoryLabel";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-5 first:border-t-0 first:pt-0 last:pb-0">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

/** The filter controls, shared by the desktop sidebar and the mobile bottom sheet. */
export function FilterPanel() {
  const t = useTranslations();
  const categoryLabel = useCategoryLabel();
  const allCategories = useCategories();
  const {
    categories,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    setMinPrice,
    setMaxPrice,
    setMinRating,
    setInStockOnly,
    toggleCategory,
  } = useFilters();

  // Keep a selected category visible even if it is not in the catalogue any more.
  const list = Array.from(new Set([...allCategories, ...categories]));

  return (
    <div>
      {list.length > 0 && (
        <Section title={t("filters.category")}>
          <ul className="-mx-1 max-h-64 space-y-0.5 overflow-y-auto pe-1 scrollbar-thin">
            {list.map((name) => {
              const checked = categories.includes(name);
              return (
                <li key={name}>
                  <label
                    className={cn(
                      "flex min-h-9 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-2",
                      checked ? "font-semibold text-fg" : "text-muted",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(name)}
                      className="h-4 w-4 shrink-0 rounded accent-brand"
                    />
                    <span className="truncate">{categoryLabel(name)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section title={t("filters.priceRange")}>
        <DualRangeSlider min={minPrice} max={maxPrice} onMinChange={setMinPrice} onMaxChange={setMaxPrice} />
      </Section>

      <Section title={t("filters.rating")}>
        <div className="-mx-1 space-y-0.5">
          {[4, 3, 2, 1].map((rating) => {
            const selected = minRating === rating;
            return (
              <button
                key={rating}
                type="button"
                aria-pressed={selected}
                onClick={() => setMinRating(selected ? 0 : rating)}
                className={cn(
                  "flex min-h-9 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  selected ? "bg-brand-soft font-semibold text-brand" : "text-muted hover:bg-surface-2",
                )}
              >
                <StarRating rating={rating} size="sm" />
                <span>{t("filters.andUp")}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t("filters.availability")}>
        <label className="flex min-h-9 cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 shrink-0 rounded accent-brand"
          />
          <span>{t("filters.inStockOnly")}</span>
        </label>
      </Section>
    </div>
  );
}

export function useHasFilters() {
  const { categories, minPrice, maxPrice, minRating, inStockOnly } = useFilters();
  return categories.length > 0 || minPrice > 0 || maxPrice < MAX_PRICE || minRating > 0 || inStockOnly;
}

/** Desktop: sticky sidebar on the start side of the catalogue. */
export function FilterSidebar() {
  const t = useTranslations("filters");
  const reset = useFilters((s) => s.reset);
  const hasFilters = useHasFilters();

  return (
    <aside className="hidden lg:block" aria-label={t("filters")}>
      <Card className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto p-5 scrollbar-thin">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("filters")}</h2>
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="text-sm font-medium text-brand underline-offset-4 hover:underline"
            >
              {t("clearAll")}
            </button>
          )}
        </div>
        <FilterPanel />
      </Card>
    </aside>
  );
}
