"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFilters } from "@/store/filters";
import { Button } from "@/components/ui";
import { FilterPanel, useHasFilters } from "./FilterSidebar";
import { Sheet } from "./Sheet";
import { SlidersIcon } from "./icons";

/** Mobile/tablet: a "Filters" button that opens the same filters in a bottom sheet. */
export function MobileFilters({ resultCount }: { resultCount: number }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const reset = useFilters((s) => s.reset);
  const hasFilters = useHasFilters();

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <SlidersIcon className="h-4 w-4" />
        {t("filters.filters")}
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="bottom"
        title={t("filters.filters")}
        footer={
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={reset} disabled={!hasFilters}>
              {t("filters.clearAll")}
            </Button>
            <Button type="button" className="flex-[1.4]" onClick={() => setOpen(false)}>
              {t("filters.showResults", { count: resultCount })}
            </Button>
          </div>
        }
      >
        <div className="p-5">
          <FilterPanel />
        </div>
      </Sheet>
    </>
  );
}
