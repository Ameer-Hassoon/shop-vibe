"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge, buttonClass, Card, EmptyState } from "@/components/ui";
import { formatDate, formatPrice } from "@/lib/format";
import { useApi } from "@/components/admin/useApi";
import { ErrorState, PageHeader, ProductThumb, Skeleton, StatusBadge } from "@/components/admin/AdminUI";
import { IconBox, IconPlus, IconReceipt } from "@/components/admin/icons";
import { ORDER_STATUSES } from "@/components/admin/types";

interface Analytics {
  overview: { totalRevenue: number; totalOrders: number; totalCustomers: number; recentRevenue: number };
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
    user: { name: string | null; email: string } | null;
    items: Array<{ quantity: number }>;
  }>;
  topProducts: Array<{ id: string; name: string; image: string; price: number; stock: number; totalSold: number }>;
  lowStockProducts: Array<{ id: string; name: string; stock: number }>;
}

const BAR_TONE: Record<string, string> = {
  PENDING: "bg-warning",
  CONFIRMED: "bg-brand",
  PROCESSING: "bg-brand",
  SHIPPED: "bg-accent",
  DELIVERED: "bg-success",
  CANCELLED: "bg-danger",
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight tabular sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
    </Card>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

export default function AdminOverviewPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const locale = useLocale();
  const analytics = useApi<Analytics>("/api/admin/analytics");
  const productCount = useApi<{ total: number }>("/api/products?limit=1");
  const orderStats = useApi<{ statusBreakdown: Record<string, number> }>("/api/admin/orders?status=NONE");

  const a = analytics.data;
  const aov = a && a.overview.totalOrders > 0 ? a.overview.totalRevenue / a.overview.totalOrders : 0;
  const lowCount = a?.lowStockProducts.length ?? 0;
  const breakdown = orderStats.data?.statusBreakdown;
  const breakdownTotal = breakdown ? Object.values(breakdown).reduce((s, n) => s + n, 0) : 0;

  return (
    <>
      <PageHeader
        title={t("overviewTitle")}
        description={t("overviewSubtitle")}
        action={
          <Link href="/admin/create" className={buttonClass("primary", "md")}>
            <IconPlus />
            {t("addProduct")}
          </Link>
        }
      />

      {analytics.error ? (
        <Card>
          <ErrorState onRetry={analytics.reload} />
        </Card>
      ) : (
        <div className="space-y-6">
          <section aria-label={t("kpiLabel")} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {!a ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-[var(--radius-card)]" />)
            ) : (
              <>
                <Stat label={t("kpiRevenue")} value={formatPrice(a.overview.totalRevenue, locale)} />
                <Stat
                  label={t("kpiRecentRevenue")}
                  value={formatPrice(a.overview.recentRevenue, locale)}
                  hint={t("last30Days")}
                />
                <Stat label={t("kpiOrders")} value={a.overview.totalOrders.toLocaleString("en")} />
                <Stat label={t("kpiAov")} value={formatPrice(aov, locale)} />
                <Stat label={t("kpiCustomers")} value={a.overview.totalCustomers.toLocaleString("en")} />
                <Stat
                  label={t("kpiProducts")}
                  value={productCount.data ? productCount.data.total.toLocaleString("en") : "—"}
                  hint={t("kpiLowStockHint", { count: lowCount })}
                />
              </>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <SectionCard
                title={t("recentOrders")}
                action={
                  <Link href="/admin/orders" className="text-sm font-semibold text-brand hover:underline">
                    {tc("viewAll")}
                  </Link>
                }
              >
                {!a ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : a.recentOrders.length === 0 ? (
                  <EmptyState
                    className="py-12"
                    icon={<IconReceipt />}
                    title={t("noOrders")}
                    description={t("noOrdersDesc")}
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {a.recentOrders.slice(0, 6).map((o) => (
                      <li key={o.id}>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              #{o.id.slice(0, 8).toUpperCase()}
                              <span className="ms-2 font-normal text-muted">
                                {o.user?.name || o.user?.email}
                              </span>
                            </p>
                            <p className="mt-0.5 text-xs text-subtle">{formatDate(o.createdAt, locale)}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-sm font-bold tabular">{formatPrice(o.total, locale)}</span>
                            <StatusBadge status={o.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <SectionCard title={t("ordersByStatus")}>
                <div className="p-4 sm:p-5">
                  {!breakdown ? (
                    <Skeleton className="h-28" />
                  ) : breakdownTotal === 0 ? (
                    <p className="text-sm text-muted">{t("noOrders")}</p>
                  ) : (
                    <ul className="space-y-3">
                      {ORDER_STATUSES.map((s) => {
                        const n = breakdown[s] ?? 0;
                        return (
                          <li key={s}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span className="text-muted">{t(`status.${s}`)}</span>
                              <span className="font-semibold tabular">{n}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                              <div
                                className={`h-full rounded-full ${BAR_TONE[s]}`}
                                style={{ width: `${(n / breakdownTotal) * 100}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </SectionCard>

              <SectionCard title={t("lowStock")}>
                {!a ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-9" />
                    <Skeleton className="h-9" />
                  </div>
                ) : a.lowStockProducts.length === 0 ? (
                  <p className="p-5 text-sm text-muted">{t("allStocked")}</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {a.lowStockProducts.slice(0, 6).map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/admin/edit/${p.id}`}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-2 sm:px-5"
                        >
                          <span className="truncate">{p.name}</span>
                          <Badge tone={p.stock === 0 ? "danger" : "warning"}>
                            {p.stock === 0 ? t("outOfStock") : t("unitsLeft", { count: p.stock })}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          </div>

          <SectionCard
            title={t("topProducts")}
            action={
              <Link href="/admin/products" className="text-sm font-semibold text-brand hover:underline">
                {tc("viewAll")}
              </Link>
            }
          >
            {!a ? (
              <div className="p-4">
                <Skeleton className="h-16" />
              </div>
            ) : a.topProducts.length === 0 ? (
              <EmptyState className="py-12" icon={<IconBox />} title={t("noTopProducts")} />
            ) : (
              <ul className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
                {a.topProducts.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/edit/${p.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5"
                    >
                      <ProductThumb src={p.image} alt="" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="text-xs text-muted tabular">
                          {formatPrice(p.price, locale)} · {t("inOrders", { count: p.totalSold })}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}
    </>
  );
}
