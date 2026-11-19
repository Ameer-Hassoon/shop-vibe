"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useFilters, MAX_PRICE } from "@/store/filters";
import { Product } from "@/types";
import { cn } from "@/lib/cn";
import { Button, EmptyState, Select } from "@/components/ui";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductGridSkeleton } from "@/components/ProductGridSkeleton";
import { FilterSidebar } from "@/components/FilterSidebar";
import { MobileFilters } from "@/components/MobileFilters";
import { Pagination } from "@/components/Pagination";
import { useCategories, useCategoryLabel } from "@/components/categoryLabel";
import { AlertIcon, ArrowDownIcon, CloseIcon, SearchIcon } from "@/components/icons";

const ITEMS_PER_PAGE = 12;

type Result = {
  key: string;
  products: Product[];
  total: number;
  totalPages: number;
  error: boolean;
};

function Hero() {
  const t = useTranslations("home");
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-brand-soft px-6 py-10 sm:px-12 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -end-16 -top-24 h-72 w-72 rounded-full bg-brand/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 end-24 h-44 w-44 rounded-full bg-accent-soft" />
        <div aria-hidden className="pointer-events-none absolute -end-6 bottom-6 h-24 w-24 rounded-full border border-brand/25" />
        <div className="relative max-w-xl">
          <p className="text-sm font-semibold text-brand">{t("heroEyebrow")}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl sm:leading-[1.1]">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{t("heroSubtitle")}</p>
          <a
            href="#catalog"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] bg-brand px-6 text-base font-semibold text-brand-fg shadow-sm transition-colors hover:bg-brand-hover"
          >
            {t("heroCta")}
            <ArrowDownIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const t = useTranslations("common");
  return (
    <span className="inline-flex h-8 items-center gap-1 rounded-full bg-brand-soft ps-3 pe-1 text-sm font-medium text-brand">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("removeFilter", { name: label })}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-brand/15"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function HomePageContent() {
  const t = useTranslations();
  const locale = useLocale();
  const categoryLabel = useCategoryLabel();
  const allCategories = useCategories();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || "";
  const {
    categories,
    minPrice,
    maxPrice,
    inStockOnly,
    sortBy,
    currentPage,
    minRating,
    setMinPrice,
    setMaxPrice,
    setMinRating,
    setInStockOnly,
    setSortBy,
    setCurrentPage,
    setCategories,
    toggleCategory,
    reset,
  } = useFilters();

  const [result, setResult] = useState<Result | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  // A new text search starts from a clean slate; ?category=Name preselects a category (footer links).
  useEffect(() => {
    if (searchQuery) reset();
  }, [searchQuery, reset]);
  useEffect(() => {
    if (categoryParam) setCategories([categoryParam]);
  }, [categoryParam, setCategories]);

  const params = new URLSearchParams();
  if (searchQuery) params.set("search", searchQuery);
  if (categories.length > 0) params.set("category", categories.join(","));
  if (inStockOnly) params.set("inStock", "true");
  if (minPrice > 0) params.set("minPrice", String(minPrice));
  if (maxPrice < MAX_PRICE) params.set("maxPrice", String(maxPrice));
  if (minRating > 0) params.set("minRating", String(minRating));
  params.set("sortBy", sortBy);
  params.set("page", String(currentPage));
  params.set("limit", String(ITEMS_PER_PAGE));
  const url = `/api/products?${params.toString()}`;
  const requestKey = `${url}#${refreshKey}`;

  useEffect(() => {
    if (!mounted) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) =>
        setResult({
          key: requestKey,
          products: data.products || [],
          total: data.total || 0,
          totalPages: data.totalPages || 1,
          error: false,
        }),
      )
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResult({ key: requestKey, products: [], total: 0, totalPages: 1, error: true });
      });
    return () => controller.abort();
    // requestKey encodes url + refreshKey
  }, [mounted, url, requestKey]);

  const loading = !mounted || !result || result.key !== requestKey;
  const totalPages = result?.totalPages ?? 1;
  const total = result?.total ?? 0;

  useEffect(() => {
    if (loading) return;
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
    else if (currentPage < 1) setCurrentPage(1);
  }, [loading, currentPage, totalPages, setCurrentPage]);

  const priceFiltered = minPrice > 0 || maxPrice < MAX_PRICE;
  const hasFilters = categories.length > 0 || priceFiltered || minRating > 0 || inStockOnly;

  const money = (v: number) =>
    new Intl.NumberFormat(`${locale}-u-nu-latn`, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors",
      active
        ? "border-brand bg-brand text-brand-fg"
        : "border-line bg-surface text-fg hover:border-line-strong hover:bg-surface-2",
    );

  return (
    <>
      {!searchQuery && <Hero />}

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {mounted && allCategories.length > 0 && (
          <nav aria-label={t("filters.category")} className="-mx-4 mb-8 sm:mx-0">
            <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-1 sm:px-0">
              <button type="button" aria-pressed={categories.length === 0} onClick={() => setCategories([])} className={chip(categories.length === 0)}>
                {t("home.allCategories")}
              </button>
              {allCategories.map((name) => {
                const active = categories.length === 1 && categories[0] === name;
                return (
                  <button key={name} type="button" aria-pressed={active} onClick={() => setCategories([name])} className={chip(active)}>
                    {categoryLabel(name)}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <section id="catalog" className="scroll-mt-32 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-10">
          <FilterSidebar />

          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
              <div className="min-w-0">
                {searchQuery ? (
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {t("home.resultsFor")} &ldquo;<span className="text-brand">{searchQuery}</span>&rdquo;
                  </h2>
                ) : (
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("home.catalogTitle")}</h2>
                )}
                <p className="mt-1 h-5 text-sm text-muted" aria-live="polite">
                  {!loading && !result?.error ? t("home.productsFound", { count: total }) : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <MobileFilters resultCount={total} />
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label={t("product.sortBy")}
                  className="w-auto min-w-40"
                >
                  <option value="newest">{t("product.newest")}</option>
                  <option value="price-low">{t("product.priceAsc")}</option>
                  <option value="price-high">{t("product.priceDesc")}</option>
                  <option value="name">{t("home.nameAsc")}</option>
                  <option value="rating">{t("product.rating")}</option>
                </Select>
              </div>
            </div>

            {hasFilters && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <RemovableChip key={cat} label={categoryLabel(cat)} onRemove={() => toggleCategory(cat)} />
                ))}
                {priceFiltered && (
                  <RemovableChip
                    label={`${money(minPrice)} – ${money(maxPrice)}${maxPrice === MAX_PRICE ? "+" : ""}`}
                    onRemove={() => {
                      setMinPrice(0);
                      setMaxPrice(MAX_PRICE);
                    }}
                  />
                )}
                {minRating > 0 && (
                  <RemovableChip label={t("home.starsUp", { rating: minRating })} onRemove={() => setMinRating(0)} />
                )}
                {inStockOnly && <RemovableChip label={t("filters.inStockOnly")} onRemove={() => setInStockOnly(false)} />}
                <button
                  type="button"
                  onClick={reset}
                  className="ms-1 text-sm font-medium text-muted underline-offset-4 hover:text-fg hover:underline"
                >
                  {t("filters.clearAll")}
                </button>
              </div>
            )}

            {loading ? (
              <ProductGridSkeleton count={ITEMS_PER_PAGE} />
            ) : result?.error ? (
              <EmptyState
                icon={<AlertIcon className="h-6 w-6" />}
                title={t("home.loadError")}
                description={t("home.loadErrorHint")}
                action={<Button onClick={() => setRefreshKey((k) => k + 1)}>{t("common.retry")}</Button>}
              />
            ) : result && result.products.length === 0 ? (
              <EmptyState
                icon={<SearchIcon className="h-6 w-6" />}
                title={t("product.noProducts")}
                description={t("home.noProductsHint")}
                action={
                  hasFilters || searchQuery ? (
                    <Button variant="outline" onClick={reset}>
                      {t("product.clearFilters")}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <ProductGrid products={result?.products ?? []} />
                {totalPages > 1 && (
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <HomePageContent />
    </Suspense>
  );
}
