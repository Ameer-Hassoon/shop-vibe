"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRequireAuth } from "@/components/account/authRedirect";
import { useFetchJson } from "@/components/account/useFetchJson";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { buttonClass } from "@/components/ui/Button";
import { ChevronIcon, PackageIcon, AlertIcon } from "@/components/account/icons";
import { ProductThumb } from "@/components/checkout/ProductThumb";
import { formatDate, formatPrice } from "@/lib/format";
import { itemCount, orderNumber, STATUS_TONE, type OrderDto } from "@/components/checkout/orderTypes";

const shell = "mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8";

export default function OrdersPage() {
  const t = useTranslations("orders");
  const tp = useTranslations("profile");
  const tc = useTranslations("common");
  const locale = useLocale();
  const auth = useRequireAuth("/orders");
  const { state, reload } = useFetchJson<OrderDto[]>(auth === "authenticated" ? "/api/orders" : null);

  const title = <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">{tp("myOrders")}</h1>;

  if (auth !== "authenticated" || state.status === "loading") {
    return (
      <div className={shell} aria-busy="true">
        {title}
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={shell}>
        {title}
        <Card>
          <EmptyState
            icon={<AlertIcon className="h-7 w-7" />}
            title={t("loadError")}
            description={tc("error")}
            action={<Button onClick={reload}>{tc("retry")}</Button>}
          />
        </Card>
      </div>
    );
  }

  const orders = Array.isArray(state.data) ? state.data : [];

  if (orders.length === 0) {
    return (
      <div className={shell}>
        {title}
        <Card>
          <EmptyState
            icon={<PackageIcon className="h-7 w-7" />}
            title={tp("noOrders")}
            description={t("noOrdersHint")}
            action={
              <Link href="/" className={buttonClass("primary", "lg")}>
                {t("startShopping")}
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={shell}>
      {title}
      <ul className="space-y-4">
        {orders.map((o) => {
          const count = itemCount(o);
          const previews = o.items.slice(0, 4);
          return (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="group block rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-line-strong sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div>
                    <p className="font-bold">
                      {t("orderNumber")} <span className="tabular" dir="ltr">#{orderNumber(o.id)}</span>
                    </p>
                    <p className="text-sm text-muted">{formatDate(o.createdAt, locale)}</p>
                  </div>
                  <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>
                    {t.has(`status.${o.status}`) ? t(`status.${o.status}`) : o.status}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex">
                      {previews.map((it) => (
                        <ProductThumb
                          key={it.id}
                          src={it.product?.image}
                          alt=""
                          className="-ms-2 h-11 w-11 rounded-lg ring-2 ring-surface first:ms-0"
                          sizes="44px"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted">{t("items", { count })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tabular text-lg font-bold">{formatPrice(o.total, locale)}</span>
                    <ChevronIcon className="h-5 w-5 text-subtle transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
