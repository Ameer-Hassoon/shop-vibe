"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useCartStore } from "@/store/cart";
import { useCartHydrated } from "@/hooks/useCart";
import { useRequireAuth } from "@/components/account/authRedirect";
import { computeOrderTotals, COD_FEE } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button, Card, EmptyState, Field, Input } from "@/components/ui";
import { buttonClass } from "@/components/ui/Button";
import { PriceBreakdown } from "@/components/checkout/PriceBreakdown";
import { CouponBox, type AppliedCoupon } from "@/components/checkout/CouponBox";
import { ProductThumb } from "@/components/checkout/ProductThumb";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import type { OrderDto } from "@/components/checkout/orderTypes";
import { AlertIcon, BagIcon, CashIcon, CheckIcon } from "@/components/account/icons";
import type { Product } from "@/types";

type FieldName = "shippingAddress" | "city" | "state" | "zipCode" | "phone";
type FormState = Record<FieldName, string>;
type Issue = { productId: string; name: string; kind: "gone" | "soldOut" | "stock"; available: number };

const EMPTY_FORM: FormState = { shippingAddress: "", city: "", state: "", zipCode: "", phone: "" };
const FIELD_ORDER: FieldName[] = ["shippingAddress", "city", "state", "zipCode", "phone"];

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const authStatus = useRequireAuth("/checkout");
  const hydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const syncProducts = useCartStore((s) => s.syncProducts);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldName | "couponCode", string>>>({});
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponNotice, setCouponNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [placed, setPlaced] = useState<OrderDto | null>(null);
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const money = (n: number) => formatPrice(n, locale);
  const lines = useMemo(() => items.map((i) => ({ price: i.product.price, quantity: i.quantity })), [items]);
  const totals = useMemo(() => computeOrderTotals(lines, { coupon }), [lines, coupon]);

  // Drop the coupon (during render, not in an effect) if the subtotal falls below its minimum.
  if (coupon && totals.subtotal < coupon.minPurchase) {
    setCoupon(null);
    setCouponNotice(t("couponRemovedMin", { amount: money(coupon.minPurchase) }));
  }

  // Only issues for products still in the cart are relevant.
  const activeIssues = issues.filter((i) => items.some((it) => it.productId === i.productId));
  const issueIds = new Set(activeIssues.map((i) => i.productId));
  const hardBlocked = activeIssues.some((i) => i.kind !== "stock") || items.some((i) => i.product.stock <= 0);

  function setField(name: FieldName, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function validate(): Partial<Record<FieldName, string>> {
    const e: Partial<Record<FieldName, string>> = {};
    for (const name of FIELD_ORDER) {
      if (!form[name].trim()) e[name] = t("errRequired");
    }
    if (!e.phone && form.phone.replace(/\D/g, "").length < 7) e.phone = t("errPhone");
    if (!e.phone && !/^[+\d\s().-]+$/.test(form.phone.trim())) e.phone = t("errPhone");
    return e;
  }

  function focusFirst(errs: Partial<Record<string, string>>) {
    const first = FIELD_ORDER.find((n) => errs[n]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  /** After OUT_OF_STOCK / PRODUCT_NOT_FOUND: find out which items are the problem and fix quantities. */
  async function diagnoseCart(fallbackMessage: string) {
    const ids = items.map((i) => i.productId);
    try {
      const res = await fetch(`/api/products?ids=${encodeURIComponent(ids.join(","))}&limit=100`);
      if (!res.ok) throw new Error("products");
      const fresh = ((await res.json()) as { products?: Product[] }).products ?? [];
      const byId = new Map(fresh.map((p) => [p.id, p]));
      const found: Issue[] = [];
      for (const it of items) {
        const p = byId.get(it.productId);
        if (!p) found.push({ productId: it.productId, name: it.product.name, kind: "gone", available: 0 });
        else if (p.stock <= 0) found.push({ productId: it.productId, name: p.name, kind: "soldOut", available: 0 });
        else if (p.stock < it.quantity) found.push({ productId: it.productId, name: p.name, kind: "stock", available: p.stock });
      }
      syncProducts(fresh);
      setIssues(found);
      setBanner(found.length ? t("issuesBanner") : fallbackMessage);
    } catch {
      setBanner(fallbackMessage);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setBanner("");
    setIssues([]);

    const clientErrors = validate();
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      focusFirst(clientErrors);
      return;
    }
    setErrors({});

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingAddress: form.shippingAddress.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zipCode: form.zipCode.trim(),
          phone: form.phone.trim(),
          ...(coupon ? { couponCode: coupon.code } : {}),
          paymentMethod: "cod",
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setPlaced(data as OrderDto);
        clearCart();
        return;
      }

      const code = data?.code as string | undefined;
      const generic = t("failedToPlaceOrder") + ". " + t("pleaseTryAgain");
      if (res.status === 401 || code === "UNAUTHORIZED") {
        router.replace(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
      } else if (code === "VALIDATION") {
        const fields = (data.fields ?? {}) as Record<string, string>;
        setErrors(fields as typeof errors);
        setBanner(t("fixHighlighted"));
        focusFirst(fields);
      } else if (code === "OUT_OF_STOCK" || code === "PRODUCT_NOT_FOUND") {
        await diagnoseCart(code === "OUT_OF_STOCK" ? t("outOfStockGeneric") : t("notFoundGeneric"));
      } else if (code === "COUPON_INVALID") {
        setCoupon(null);
        setErrors({ couponCode: typeof data.error === "string" ? data.error : t("couponFailed") });
        setBanner(t("couponInvalidBanner"));
      } else {
        setBanner(generic);
      }
    } catch {
      setBanner(t("failedToPlaceOrder") + ". " + t("pleaseTryAgain"));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const shell = "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8";

  if (placed) return <OrderConfirmation order={placed} />;

  if (!hydrated || authStatus !== "authenticated") {
    return (
      <div className={shell} aria-busy="true">
        <div className="mb-8 h-9 w-48 animate-pulse rounded-lg bg-surface-2" />
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
          <div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={shell}>
        <Card>
          <EmptyState
            icon={<BagIcon className="h-7 w-7" />}
            title={tCart("emptyCart")}
            description={tCart("addSomeItems")}
            action={
              <Link href="/" className={buttonClass("primary", "lg")}>
                {tCart("continueShopping")}
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={shell}>
      <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h1>

      {banner && (
        <div role="alert" className="mb-6 rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          <p className="flex items-center gap-2 font-semibold">
            <AlertIcon className="h-5 w-5 shrink-0" />
            {banner}
          </p>
          {activeIssues.length > 0 && (
            <ul className="mt-3 space-y-2 text-fg">
              {activeIssues.map((i) => (
                <li key={i.productId} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {i.kind === "gone"
                      ? t("issueGone", { name: i.name })
                      : i.kind === "soldOut"
                        ? t("issueSoldOut", { name: i.name })
                        : t("issueStock", { name: i.name, available: i.available })}
                  </span>
                  {i.kind !== "stock" && (
                    <Button type="button" size="sm" variant="outline" onClick={() => removeFromCart(i.productId)}>
                      {t("removeItem")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {activeIssues.length > 0 && (
            <Link href="/cart" className="mt-3 inline-block font-semibold underline">
              {t("backToCart")}
            </Link>
          )}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-5 text-lg font-semibold">{t("shippingInfo")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("address")} error={errors.shippingAddress} className="sm:col-span-2">
                {(p) => (
                  <Input {...p} name="shippingAddress" autoComplete="street-address" value={form.shippingAddress}
                    onChange={(e) => setField("shippingAddress", e.target.value)} />
                )}
              </Field>
              <Field label={t("city")} error={errors.city}>
                {(p) => (
                  <Input {...p} name="city" autoComplete="address-level2" value={form.city}
                    onChange={(e) => setField("city", e.target.value)} />
                )}
              </Field>
              <Field label={t("state")} error={errors.state}>
                {(p) => (
                  <Input {...p} name="state" autoComplete="address-level1" value={form.state}
                    onChange={(e) => setField("state", e.target.value)} />
                )}
              </Field>
              <Field label={t("zipCode")} error={errors.zipCode}>
                {(p) => (
                  <Input {...p} name="zipCode" autoComplete="postal-code" inputMode="text" value={form.zipCode}
                    onChange={(e) => setField("zipCode", e.target.value)} />
                )}
              </Field>
              <Field label={t("phone")} hint={t("phoneHint")} error={errors.phone}>
                {(p) => (
                  <Input {...p} name="phone" type="tel" autoComplete="tel" inputMode="tel" dir="ltr"
                    className="text-start" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                )}
              </Field>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 id="payment-heading" className="mb-4 text-lg font-semibold">{t("paymentMethod")}</h2>
            <div role="radiogroup" aria-labelledby="payment-heading">
              <div
                role="radio"
                aria-checked="true"
                tabIndex={0}
                className="flex items-start gap-4 rounded-xl border-2 border-brand bg-brand-soft p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
                  <CashIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t("cashOnDelivery")}</p>
                  <p className="mt-0.5 text-sm text-muted">{t("codDescription", { fee: money(COD_FEE) })}</p>
                </div>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
                  <CheckIcon className="h-4 w-4" />
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">{t("onlinePaymentNote")}</p>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24">
          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="text-lg font-semibold">{t("orderSummary")}</h2>
            <ul className="max-h-72 space-y-3 overflow-y-auto pe-1 scrollbar-thin">
              {items.map((i) => (
                <li
                  key={i.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl",
                    issueIds.has(i.productId) && "bg-danger-soft p-2 ring-1 ring-danger/40",
                  )}
                >
                  <ProductThumb src={i.product.image} alt={i.product.name} className="h-14 w-14" sizes="56px" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{i.product.name}</p>
                    <p className="text-xs text-muted">
                      {t("quantity")}: <span className="tabular">{i.quantity}</span>
                    </p>
                  </div>
                  <p className="tabular text-sm font-semibold">{money(i.product.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-line pt-5">
              <CouponBox
                subtotal={totals.subtotal}
                coupon={coupon}
                onApply={(c) => {
                  setCoupon(c);
                  setCouponNotice("");
                  setErrors((e) => ({ ...e, couponCode: undefined }));
                }}
                onRemove={() => setCoupon(null)}
                externalError={errors.couponCode}
                notice={couponNotice}
              />
            </div>
            <PriceBreakdown values={totals} couponCode={coupon?.code} />
            <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={hardBlocked}>
              {submitting ? t("processingOrder") : `${t("placeOrder")} · ${money(totals.total)}`}
            </Button>
            <p className="text-center text-xs text-muted">{t("previewNote")}</p>
            <Link href="/cart" className="block text-center text-sm text-muted transition-colors hover:text-brand">
              {t("backToCart")}
            </Link>
          </Card>
        </aside>
      </form>
    </div>
  );
}
