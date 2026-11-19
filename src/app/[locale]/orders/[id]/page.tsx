"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRequireAuth } from "@/components/account/authRedirect";
import { useFetchJson } from "@/components/account/useFetchJson";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { buttonClass } from "@/components/ui/Button";
import { AlertIcon, CashIcon, ChevronIcon, PackageIcon } from "@/components/account/icons";
import { OrderTrackingTimeline } from "@/components/OrderTrackingTimeline";
import { PriceBreakdown } from "@/components/checkout/PriceBreakdown";
import { ProductThumb } from "@/components/checkout/ProductThumb";
import { formatDate, formatPrice } from "@/lib/format";
import { orderBreakdown, orderNumber, STATUS_TONE, type OrderDto } from "@/components/checkout/orderTypes";

const shell = "mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8";
const CANCELLABLE = ["PENDING", "CONFIRMED"];

export default function OrderDetailsPage() {
  const t = useTranslations("orders");
  const tc = useTranslations("common");
  const locale = useLocale();
  const params = useParams();
  const orderId = params.id as string;
  const auth = useRequireAuth(`/orders/${orderId}`);
  const { state, reload } = useFetchJson<OrderDto>(auth === "authenticated" ? `/api/orders/${orderId}` : null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const back = (
    <Link href="/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-brand">
      <ChevronIcon className="h-4 w-4 rotate-180 rtl:rotate-0" />
      {t("backToOrders")}
    </Link>
  );

  if (auth !== "authenticated" || state.status === "loading") {
    return (
      <div className={shell} aria-busy="true">
        <div className="mb-8 h-9 w-64 animate-pulse rounded-lg bg-surface-2" />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
          <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    const missing = state.httpStatus === 404 || state.httpStatus === 403;
    return (
      <div className={shell}>
        {back}
        <Card>
          <EmptyState
            icon={missing ? <PackageIcon className="h-7 w-7" /> : <AlertIcon className="h-7 w-7" />}
            title={missing ? t("notFound") : t("loadError")}
            description={missing ? t("notFoundHint") : tc("error")}
            action={
              missing ? (
                <Link href="/orders" className={buttonClass("primary")}>
                  {t("backToOrders")}
                </Link>
              ) : (
                <Button onClick={reload}>{tc("retry")}</Button>
              )
            }
          />
        </Card>
      </div>
    );
  }

  const order = state.data;
  const b = orderBreakdown(order);
  const canCancel = CANCELLABLE.includes(order.status);

  async function cancelOrder() {
    setCancelling(true);
    setCancelError("");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) {
        setCancelError(t("cancelFailed"));
        return;
      }
      setConfirming(false);
      reload();
    } catch {
      setCancelError(t("cancelFailed"));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className={shell}>
      {back}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("orderNumber")} <span className="tabular" dir="ltr">#{orderNumber(order.id)}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">{t("placedOn", { date: formatDate(order.createdAt, locale) })}</p>
        </div>
        <Badge tone={STATUS_TONE[order.status] ?? "neutral"} className="px-3 py-1 text-sm">
          {t.has(`status.${order.status}`) ? t(`status.${order.status}`) : order.status}
        </Badge>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-5 text-lg font-semibold">{t("orderStatus")}</h2>
            <OrderTrackingTimeline
              status={order.status}
              estimatedDelivery={order.estimatedDelivery}
              trackingNumber={order.trackingNumber}
              carrier={order.carrier}
            />
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("itemsHeading")}</h2>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <ProductThumb src={item.product?.image} alt={item.product?.name ?? ""} className="h-16 w-16" sizes="64px" />
                  <div className="min-w-0 flex-1">
                    {item.product ? (
                      <Link href={`/product/${item.product.id}`} className="line-clamp-2 text-sm font-medium transition-colors hover:text-brand">
                        {item.product.name}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{t("removedProduct")}</p>
                    )}
                    <p className="tabular mt-0.5 text-xs text-muted">
                      {formatPrice(item.price, locale)} × {item.quantity}
                    </p>
                  </div>
                  <p className="tabular text-sm font-semibold">{formatPrice(item.price * item.quantity, locale)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("summary")}</h2>
            <PriceBreakdown values={b} couponCode={order.coupon?.code} />
          </Card>

          <Card className="space-y-5 p-5 sm:p-6">
            <div>
              <h2 className="mb-2 text-lg font-semibold">{t("deliveryAddress")}</h2>
              <address className="text-sm not-italic leading-relaxed text-muted">
                {order.shippingAddress}
                <br />
                {order.city}, {order.state} {order.zipCode}
                {order.phone && (
                  <>
                    <br />
                    <span dir="ltr" className="tabular">{order.phone}</span>
                  </>
                )}
              </address>
            </div>
            <div>
              <h2 className="mb-2 text-lg font-semibold">{t("payment")}</h2>
              <p className="flex items-center gap-2 text-sm text-muted">
                <CashIcon className="h-5 w-5 text-brand" />
                {t("cod")}
              </p>
            </div>
          </Card>

          {canCancel && (
            <Card className="p-5 sm:p-6">
              {confirming ? (
                <div role="alertdialog" aria-labelledby="cancel-title" aria-describedby="cancel-desc">
                  <p id="cancel-title" className="font-semibold">{t("cancelConfirmTitle")}</p>
                  <p id="cancel-desc" className="mt-1 text-sm text-muted">{t("cancelConfirmText")}</p>
                  {cancelError && (
                    <p role="alert" className="mt-2 text-sm text-danger">{cancelError}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="danger" loading={cancelling} onClick={cancelOrder}>
                      {t("cancelConfirmYes")}
                    </Button>
                    <Button variant="outline" disabled={cancelling} onClick={() => { setConfirming(false); setCancelError(""); }}>
                      {t("cancelConfirmNo")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full text-danger" onClick={() => setConfirming(true)}>
                  {t("cancelOrder")}
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
