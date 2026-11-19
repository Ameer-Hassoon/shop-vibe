"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { categoryKey } from "@/lib/categories";


/** Returns a function that turns a raw category name (or legacy `cat.x` key) into a translated label. */
export function useCategoryLabel() {
  const t = useTranslations("categories");
  return useCallback(
    (name: string) => {
      const key = categoryKey(name);
      return key && t.has(key) ? t(key) : name;
    },
    [t],
  );
}

let cache: string[] | null = null;
let inflight: Promise<string[]> | null = null;

function loadCategories(): Promise<string[]> {
  if (cache) return Promise.resolve(cache);
  inflight ??= fetch("/api/products?limit=100")
    .then((res) => (res.ok ? res.json() : { products: [] }))
    .then((data: { products?: { category: string }[] }) => {
      const names = Array.from(new Set((data.products ?? []).map((p) => p.category).filter(Boolean)));
      cache = names.sort((a, b) => a.localeCompare(b));
      return cache;
    })
    .catch(() => [] as string[])
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Distinct category names currently in the catalogue (fetched once per page load). */
export function useCategories(): string[] {
  const [categories, setCategories] = useState<string[]>(cache ?? []);
  useEffect(() => {
    let active = true;
    loadCategories().then((names) => {
      if (active) setCategories(names);
    });
    return () => {
      active = false;
    };
  }, []);
  return categories;
}
