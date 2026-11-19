"use client";

import { use, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, buttonClass, Card, EmptyState, Field, Input, Select } from "@/components/ui";
import { formatDate, formatPrice } from "@/lib/format";
import { useApi } from "@/components/admin/useApi";
import {
  ErrorState,
  Notice,
  PageHeader,
  ProductThumb,
  shortId,
  Skeleton,
  StatusBadge,
} from "@/components/admin/AdminUI";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { IconArrowBack, IconReceipt } from "@/components/admin/icons";
import type { AdminOrder } from "@/components/admin/types";
import { isOrderStatus, NEXT_STATUSES } from "@/lib/orderStatus";


function Row({ label, value, strong, tone }: { label: string; value: React.ReactNode; strong?: boolean; tone?: "success" }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-1.5 text-sm ${strong ? "border-t border-line pt-3 text-base font-bold" : ""}`}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd className={`tabular ${tone === "success" ? "text-success" : ""}`}>{value}</dd>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-subtle">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

function OrderDetail({ order: initial, onChanged }: { order: AdminOrder; onChanged: () => void }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [order, setOrder] = useState(initial);

  const [nextStatus, setNextStatus] = useState(initial.status);
  const [restoreStock, setRestoreStock] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const [tracking, setTracking] = useState(initial.trackingNumber ?? "");
  const [carrier, setCarrier] = useState(initial.carrier ?? "");
  const [eta, setEta] = useState(initial.estimatedDelivery ? initial.estimatedDelivery.slice(0, 10) : "");
  const [shipBusy, setShipBusy] = useState(false);

  const options = isOrderStatus(order.status) ? NEXT_STATUSES[order.status] : [];
  const itemsSum = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const subtotal = order.subtotal && order.subtotal > 0 ? order.subtotal : itemsSum;
  const discount = order.discountAmount ?? 0;
  const shipping = order.shippingFee ?? 0;
  const tax = order.tax ?? 0;
  const codFee = order.codFee ?? 0;

  async function save(body: Record<string, unknown>, done: string, setBusy: (b: boolean) => void) {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "");
      if (json?.order) {
        setOrder((o) => ({ ...o, ...json.order }));
        setNextStatus(json.order.status);
      }
      setFeedback({ tone: "success", text: done });
      onChanged();
    } catch (e) {
      setFeedback({ tone: "danger", text: (e as Error).message || t("updateFailed") });
    } finally {
      setBusy(false);
      setConfirmCancel(false);
    }
  }

  const applyStatus = () => {
    if (nextStatus === order.status) return;
    if (nextStatus === "CANCELLED") setConfirmCancel(true);
    else save({ status: nextStatus }, t("statusUpdated", { status: t(`status.${nextStatus}`) }), setStatusBusy);
  };

  return (
    <>
      <PageHeader
        title={t("orderNumber", { id: shortId(order.id) })}
        description={t("placedOn", { date: formatDate(order.createdAt, locale) })}
        action={<StatusBadge status={order.status} />}
        back={
          <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
            <IconArrowBack className="h-4 w-4" />
            {t("backToOrders")}
          </Link>
        }
      />

      {feedback && <Notice tone={feedback.tone} onDismiss={() => setFeedback(null)}>{feedback.text}</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <h2 className="border-b border-line px-5 py-3.5 text-lg font-semibold">{t("items")}</h2>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <ProductThumb src={i.product?.image} alt="" />
                  <div className="min-w-0 flex-1">
                    {i.product ? (
                      <Link href={`/admin/edit/${i.product.id}`} className="line-clamp-2 text-sm font-semibold hover:text-brand">
                        {i.product.name}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-muted">{t("productRemoved")}</p>
                    )}
                    <p className="text-xs text-muted tabular">
                      {formatPrice(i.price, locale)} × {i.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-bold tabular">{formatPrice(i.price * i.quantity, locale)}</p>
                </li>
              ))}
            </ul>
            <dl className="border-t border-line bg-surface-2/40 px-5 py-4">
              <Row label={t("subtotal")} value={formatPrice(subtotal, locale)} />
              {discount > 0 && (
                <Row
                  label={order.coupon?.code ? t("discountWithCode", { code: order.coupon.code }) : t("discount")}
                  value={`−${formatPrice(discount, locale)}`}
                  tone="success"
                />
              )}
              <Row label={t("shipping")} value={shipping > 0 ? formatPrice(shipping, locale) : t("free")} />
              {tax > 0 && <Row label={t("tax")} value={formatPrice(tax, locale)} />}
              {codFee > 0 && <Row label={t("codFee")} value={formatPrice(codFee, locale)} />}
              <Row strong label={t("total")} value={formatPrice(order.total, locale)} />
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">{t("customer")}</h2>
            <dl className="space-y-4">
              <Detail label={t("colCustomer")}>
                <p className="font-medium">{order.user?.name || "—"}</p>
                <p className="break-all text-muted">{order.user?.email}</p>
              </Detail>
              <Detail label={t("phone")}>
                {order.phone ? <span dir="ltr" className="tabular">{order.phone}</span> : <span className="text-subtle">—</span>}
              </Detail>
              <Detail label={t("shippingAddress")}>
                <p>{order.shippingAddress}</p>
                <p className="text-muted">
                  {[order.city, order.state, order.zipCode].filter(Boolean).join(", ")}
                </p>
              </Detail>
              <Detail label={t("payment")}>
                {!order.paymentMethod || order.paymentMethod === "cod" ? t("paymentCod") : order.paymentMethod}
              </Detail>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">{t("updateStatus")}</h2>
            {options.length === 0 ? (
              <p className="text-sm text-muted">{t("statusFinal")}</p>
            ) : (
              <div className="space-y-3">
                <Field label={t("colStatus")}>
                  {(p) => (
                    <Select {...p} value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} disabled={statusBusy}>
                      <option value={order.status}>{t(`status.${order.status}`)}</option>
                      {options.map((s) => (
                        <option key={s} value={s}>
                          {t(`status.${s}`)}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Button
                  className="w-full"
                  onClick={applyStatus}
                  loading={statusBusy}
                  disabled={nextStatus === order.status}
                >
                  {t("updateStatusBtn")}
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">{t("shipment")}</h2>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                save(
                  {
                    trackingNumber: tracking.trim(),
                    carrier: carrier.trim(),
                    estimatedDelivery: eta ? new Date(`${eta}T12:00:00Z`).toISOString() : null,
                  },
                  t("shipmentSaved"),
                  setShipBusy,
                );
              }}
            >
              <Field label={t("trackingNumber")}>
                {(p) => <Input {...p} dir="ltr" value={tracking} onChange={(e) => setTracking(e.target.value)} disabled={shipBusy} className="text-start" />}
              </Field>
              <Field label={t("carrier")}>
                {(p) => <Input {...p} value={carrier} onChange={(e) => setCarrier(e.target.value)} disabled={shipBusy} />}
              </Field>
              <Field label={t("estimatedDelivery")}>
                {(p) => <Input {...p} type="date" value={eta} onChange={(e) => setEta(e.target.value)} disabled={shipBusy} />}
              </Field>
              <Button type="submit" variant="outline" className="w-full" loading={shipBusy}>
                {t("saveShipment")}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title={t("cancelOrderTitle")}
        description={t("cancelOrderBody", { id: shortId(order.id) })}
        confirmLabel={t("cancelOrderConfirm")}
        cancelLabel={t("keepOrder")}
        loading={statusBusy}
        onConfirm={() =>
          save({ status: "CANCELLED", restoreStock }, t("statusUpdated", { status: t("status.CANCELLED") }), setStatusBusy)
        }
        onCancel={() => setConfirmCancel(false)}
      >
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={restoreStock}
            onChange={(e) => setRestoreStock(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
          />
          <span>{t("restoreStock")}</span>
        </label>
      </ConfirmDialog>
    </>
  );
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("admin");
  const { data, error, reload } = useApi<AdminOrder>(`/api/admin/orders/${encodeURIComponent(id)}`);

  if (error?.status === 404) {
    return (
      <Card>
        <EmptyState
          icon={<IconReceipt />}
          title={t("orderNotFound")}
          description={t("orderNotFoundDesc")}
          action={
            <Link href="/admin/orders" className={buttonClass("primary", "md")}>
              {t("backToOrders")}
            </Link>
          }
        />
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <ErrorState onRetry={reload} />
      </Card>
    );
  }
  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-[var(--radius-card)] lg:col-span-2" />
          <Skeleton className="h-80 rounded-[var(--radius-card)]" />
        </div>
      </div>
    );
  }
  return <OrderDetail key={data.id} order={data} onChanged={reload} />;
}
