"use client";

import { Suspense, useEffect, useState } from "react";
import { categoryKey } from "@/lib/categories";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Badge, Button, buttonClass, Card, EmptyState, Input, Select } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { useApi } from "@/components/admin/useApi";
import {
  AdminPagination,
  ErrorState,
  Notice,
  PageHeader,
  ProductThumb,
  Skeleton,
  useDebounced,
} from "@/components/admin/AdminUI";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { IconBox, IconPencil, IconPlus, IconSearch, IconTrash } from "@/components/admin/icons";
import { PRODUCT_CATEGORIES, type AdminProduct } from "@/components/admin/types";

interface ProductsResponse {
  products: AdminProduct[];
  total: number;
  page: number;
  totalPages: number;
}

const LIMIT = 10;
const SORTS = ["newest", "price-low", "price-high", "name", "rating"] as const;
const SORT_KEY: Record<(typeof SORTS)[number], string> = {
  newest: "sortNewest",
  "price-low": "sortPriceLow",
  "price-high": "sortPriceHigh",
  name: "sortName",
  rating: "sortRating",
};

function StockBadge({ stock }: { stock: number }) {
  const t = useTranslations("admin");
  if (stock === 0) return <Badge tone="danger">{t("outOfStock")}</Badge>;
  if (stock <= 10) return <Badge tone="warning">{t("unitsLeft", { count: stock })}</Badge>;
  return <span className="text-sm tabular">{stock}</span>;
}

function Rating({ value, count }: { value: number; count: number }) {
  if (!count) return <span className="text-sm text-subtle">—</span>;
  return (
    <span className="text-sm tabular">
      {value.toFixed(1)} <span className="text-accent">★</span>
      <span className="ms-1 text-xs text-subtle">({count})</span>
    </span>
  );
}

function ProductsContent() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tCat = useTranslations("categories");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [notice, setNotice] = useState<string | null>(() => {
    const n = searchParams.get("notice");
    return n === "created" ? t("productCreated") : n === "updated" ? t("productUpdated") : null;
  });
  useEffect(() => {
    if (searchParams.get("notice")) router.replace("/admin/products");
  }, [searchParams, router]);

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput.trim());
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("newest");
  const [page, setPage] = useState(1);

  const [target, setTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT), sortBy: sort });
  if (search) qs.set("search", search);
  if (category) qs.set("category", category);
  const { data, error, loading, reload } = useApi<ProductsResponse>(`/api/products?${qs}`);

  const filtered = Boolean(search || category);
  const catLabel = (c: string) => {
    const key = categoryKey(c);
    return key && tCat.has(key) ? tCat(key) : c;
  };

  async function confirmDelete() {
    if (!target) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/products/${target.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setNotice(t("deleteSuccess", { name: target.name }));
      setTarget(null);
      if (data && data.products.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch {
      setDeleteError(t("deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  const actions = (p: AdminProduct) => (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/edit/${p.id}`}
        aria-label={`${tc("edit")}: ${p.name}`}
        className={buttonClass("ghost", "icon")}
      >
        <IconPencil />
      </Link>
      <button
        type="button"
        aria-label={`${tc("delete")}: ${p.name}`}
        onClick={() => {
          setDeleteError(null);
          setTarget(p);
        }}
        className={buttonClass("ghost", "icon", "text-danger hover:bg-danger-soft")}
      >
        <IconTrash />
      </button>
    </div>
  );

  return (
    <>
      <PageHeader
        title={t("productsTitle")}
        description={data ? t("productsSubtitle", { count: data.total }) : undefined}
        action={
          <Link href="/admin/create" className={buttonClass("primary", "md")}>
            <IconPlus />
            {t("addProduct")}
          </Link>
        }
      />

      {notice && <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>}

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-subtle" />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchProducts")}
            aria-label={t("searchProducts")}
            className="ps-10"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          aria-label={t("fCategory")}
          className="sm:w-56"
        >
          <option value="">{t("allCategories")}</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {tCat(c.key)}
            </option>
          ))}
        </Select>
        <Select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as (typeof SORTS)[number]);
            setPage(1);
          }}
          aria-label={t("sortBy")}
          className="sm:w-48"
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {t(SORT_KEY[s])}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      ) : !data ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </Card>
      ) : data.products.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconBox />}
            title={filtered ? t("noResults") : t("noProducts")}
            description={filtered ? t("noResultsDesc") : t("noProductsDesc")}
            action={
              filtered ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput("");
                    setCategory("");
                    setPage(1);
                  }}
                >
                  {t("clearFilters")}
                </Button>
              ) : (
                <Link href="/admin/create" className={buttonClass("primary", "md")}>
                  <IconPlus />
                  {t("addProduct")}
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface-2/60 text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start">{t("colProduct")}</th>
                  <th scope="col" className="px-4 py-3 text-start">{t("colCategory")}</th>
                  <th scope="col" className="px-4 py-3 text-start">{t("colPrice")}</th>
                  <th scope="col" className="px-4 py-3 text-start">{t("colStock")}</th>
                  <th scope="col" className="px-4 py-3 text-start">{t("colRating")}</th>
                  <th scope="col" className="px-4 py-3 text-end"><span className="sr-only">{t("colActions")}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.products.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-surface-2/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb src={p.image} alt="" />
                        <Link
                          href={`/admin/edit/${p.id}`}
                          className="line-clamp-2 max-w-xs font-semibold hover:text-brand"
                        >
                          {p.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{catLabel(p.category)}</td>
                    <td className="px-4 py-3 font-bold tabular">{formatPrice(p.price, locale)}</td>
                    <td className="px-4 py-3"><StockBadge stock={p.stock} /></td>
                    <td className="px-4 py-3"><Rating value={p.averageRating} count={p.reviewCount} /></td>
                    <td className="px-2 py-2">{actions(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {data.products.map((p) => (
              <li key={p.id}>
                <Card className="p-3">
                  <div className="flex gap-3">
                    <ProductThumb src={p.image} alt="" className="h-16 w-16" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/edit/${p.id}`} className="line-clamp-2 font-semibold">
                        {p.name}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-muted">{catLabel(p.category)}</p>
                      <p className="mt-1 font-bold tabular">{formatPrice(p.price, locale)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2">
                    <div className="flex items-center gap-3">
                      <StockBadge stock={p.stock} />
                      <Rating value={p.averageRating} count={p.reviewCount} />
                    </div>
                    {actions(p)}
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <AdminPagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={target !== null}
        title={t("deleteTitle")}
        description={target ? t("deleteBody", { name: target.name }) : undefined}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ProductsContent />
    </Suspense>
  );
}
