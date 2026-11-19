"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Card, EmptyState, Input } from "@/components/ui";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useApi } from "@/components/admin/useApi";
import {
  AdminPagination,
  ErrorState,
  PageHeader,
  shortId,
  Skeleton,
  StatusBadge,
  useDebounced,
} from "@/components/admin/AdminUI";
import { IconChevron, IconReceipt, IconSearch } from "@/components/admin/icons";
import { ORDER_STATUSES, type AdminOrder } from "@/components/admin/types";

interface OrdersResponse {
  orders: AdminOrder[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  statusBreakdown: Record<string, number>;
}

const TABS = ["ALL", ...ORDER_STATUSES] as const;

export default function AdminOrdersPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [status, setStatus] = useState<(typeof TABS)[number]>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput.trim());
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({ page: String(page) });
  if (status !== "ALL") qs.set("status", status);
  if (search) qs.set("search", search);
  const { data, error, loading, reload } = useApi<OrdersResponse>(`/api/admin/orders?${qs}`);

  const counts = data?.statusBreakdown;
  const allCount = counts ? Object.values(counts).reduce((s, n) => s + n, 0) : undefined;
  const filtered = status !== "ALL" || Boolean(search);

  return (
    <>
      <PageHeader
        title={t("ordersTitle")}
        description={data ? t("ordersSubtitle", { count: allCount ?? data.pagination.total }) : undefined}
      />

      <div
        role="group"
        aria-label={t("filterByStatus")}
        className="scrollbar-thin -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {TABS.map((s) => {
          const active = s === status;
          const n = s === "ALL" ? allCount : counts?.[s] ?? 0;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors",
                active
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {s === "ALL" ? t("tabAll") : t(`status.${s}`)}
              {n !== undefined && <span className="text-xs tabular opacity-70">{n}</span>}
            </button>
          );
        })}
      </div>

      <div className="relative mb-4 sm:max-w-sm">
        <IconSearch className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-subtle" />
        <Input
          type="search"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
          placeholder={t("searchOrders")}
          aria-label={t("searchOrders")}
          className="ps-10"
        />
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
      ) : data.orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconReceipt />}
            title={filtered ? t("noOrdersFiltered") : t("noOrders")}
            description={filtered ? t("noResultsDesc") : t("noOrdersDesc")}
            action={
              filtered ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatus("ALL");
                    setSearchInput("");
                    setPage(1);
                  }}
                >
                  {t("clearFilters")}
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface-2/60 text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start">{t("colOrder")}</th>
                  <th scope="col" className="px-4 py-3 text-start">{t("colCustomer")}</th>
                  <th scope="col" className="px-4 py-3 text-start">{t("colDate")}</th>
                  <th scope="col" className="px-4 py-3 text-start">{t("colItems")}</th>
                  <th scope="col" className="px-4 py-3 text-start">{t("colTotal")}</th>
                  <th scope="col" className="px-4 py-3 text-start">{t("colStatus")}</th>
                  <th scope="col" className="w-10 px-2 py-3"><span className="sr-only">{t("viewOrder")}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.orders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-surface-2/50">
                    <td className="px-4 py-3 font-semibold tabular">
                      <Link href={`/admin/orders/${o.id}`} className="hover:text-brand">
                        {shortId(o.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.user?.name || "—"}</p>
                      <p className="text-xs text-muted">{o.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(o.createdAt, locale)}</td>
                    <td className="px-4 py-3 tabular">
                      {o.items.reduce((s, i) => s + i.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 font-bold tabular">{formatPrice(o.total, locale)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-2 py-3 text-subtle">
                      <Link href={`/admin/orders/${o.id}`} aria-label={`${t("viewOrder")} ${shortId(o.id)}`}>
                        <IconChevron />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <ul className="space-y-3 md:hidden">
            {data.orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="block">
                  <Card className="p-4 transition-colors hover:bg-surface-2/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold tabular">{shortId(o.id)}</p>
                        <p className="truncate text-sm text-muted">{o.user?.name || o.user?.email}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                      <span className="text-muted">
                        {formatDate(o.createdAt, locale)} · {t("itemsCount", { count: o.items.reduce((s, i) => s + i.quantity, 0) })}
                      </span>
                      <span className="font-bold tabular">{formatPrice(o.total, locale)}</span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          <AdminPagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </div>
      )}
    </>
  );
}
