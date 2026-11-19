"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCartStore, maxQuantityFor } from "@/store/cart";
import { useCartHydrated } from "@/hooks/useCart";
import { computeOrderTotals, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { buttonClass } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui";
import { PriceBreakdown } from "@/components/checkout/PriceBreakdown";
import { ProductThumb } from "@/components/checkout/ProductThumb";
import { QuantityStepper } from "@/components/checkout/QuantityStepper";
import { AlertIcon, BagIcon, TrashIcon } from "@/components/account/icons";
import type { Product } from "@/types";

export default function CartPage() {
  const t = useTranslations("cart");
  const tc = useTranslations("checkout");
  const locale = useLocale();
  const hydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const syncProducts = useCartStore((s) => s.syncProducts);
  const [missing, setMissing] = useState<Set<string>>(new Set());

  // Refresh price / stock snapshots so the cart never shows stale data.
  const idsKey = items.map((i) => i.productId).sort().join(",");
  useEffect(() => {
    if (!hydrated || !idsKey) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/products?ids=${encodeURIComponent(idsKey)}&limit=100`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { products?: Product[] };
        const fresh = data.products ?? [];
        syncProducts(fresh);
        const found = new Set(fresh.map((p) => p.id));
        setMissing(new Set(idsKey.split(",").filter((id) => !found.has(id))));
      } catch {
        /* offline or aborted: keep the stored snapshot */
      }
    })();
    return () => ctrl.abort();
  }, [hydrated, idsKey, syncProducts]);

  const money = (n: number) => formatPrice(n, locale);
  const lines = useMemo(() => items.map((i) => ({ price: i.product.price, quantity: i.quantity })), [items]);
  const totals = useMemo(() => computeOrderTotals(lines), [lines]);
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totals.subtotal);
  const progress = Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const blocked = items.some((i) => i.product.stock <= 0 || missing.has(i.productId));

  const shell = "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8";

  if (!hydrated) {
    return (
      <div className={shell} aria-busy="true">
        <div className="mb-8 h-9 w-48 animate-pulse rounded-lg bg-surface-2" />
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
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
            title={t("emptyCart")}
            description={t("addSomeItems")}
            action={
              <Link href="/" className={buttonClass("primary", "lg")}>
                {t("continueShopping")}
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={shell}>
      <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
        {t("yourCart")}{" "}
        <span className="text-lg font-medium text-muted">({t("itemCount", { count: itemCount })})</span>
      </h1>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-4">
          {items.map((item) => {
            const p = item.product;
            const max = maxQuantityFor(p);
            const outOfStock = p.stock <= 0;
            const gone = missing.has(item.productId);
            return (
              <li key={item.id}>
                <Card className="flex gap-4 p-4 sm:gap-5 sm:p-5">
                  <Link href={`/product/${p.id}`} className="shrink-0">
                    <ProductThumb src={p.image} alt={p.name} className="h-24 w-24 sm:h-28 sm:w-28" sizes="112px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${p.id}`}
                          className="line-clamp-2 font-semibold transition-colors hover:text-brand"
                        >
                          {p.name}
                        </Link>
                        <p className="tabular mt-1 text-sm text-muted">{money(p.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        aria-label={t("removeNamed", { name: p.name })}
                        className="-me-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                      >
                        <TrashIcon />
                      </button>
                    </div>

                    {(outOfStock || gone) && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-danger" role="alert">
                        <AlertIcon className="h-4 w-4 shrink-0" />
                        {gone ? t("unavailable") : t("outOfStock")}
                      </p>
                    )}
                    {!outOfStock && !gone && p.stock <= 5 && (
                      <p className="mt-2 text-xs text-warning">{t("onlyLeft", { count: p.stock })}</p>
                    )}

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                      <QuantityStepper
                        value={item.quantity}
                        max={outOfStock || gone ? item.quantity : max}
                        label={t("quantityFor", { name: p.name })}
                        onChange={(q) => updateQuantity(item.productId, q)}
                      />
                      <p className="tabular text-lg font-bold">{money(p.price * item.quantity)}</p>
                    </div>
                    {!outOfStock && !gone && item.quantity >= max && (
                      <p className="mt-2 text-xs text-muted">{t("maxReached")}</p>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>

        <aside className="lg:sticky lg:top-24">
          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="text-lg font-semibold">{tc("orderSummary")}</h2>

            <div className="rounded-xl bg-surface-2 p-3.5">
              <p className="text-sm">
                {remaining > 0 ? (
                  t("freeShippingMore", { amount: money(remaining) })
                ) : (
                  <span className="font-medium text-success">{t("freeShippingUnlocked")}</span>
                )}
              </p>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-label={t("freeShippingProgress")}
              >
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <PriceBreakdown values={totals} totalLabel={t("estimatedTotal")} />
            <p className="text-xs text-muted">{t("couponAtCheckout")}</p>

            {blocked ? (
              <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger" role="alert">
                {t("fixCartFirst")}
              </p>
            ) : null}

            {blocked ? (
              <span aria-disabled="true" className={buttonClass("primary", "lg", "w-full pointer-events-none opacity-50")}>
                {t("checkout")}
              </span>
            ) : (
              <Link href="/checkout" className={buttonClass("primary", "lg", "w-full")}>
                {t("checkout")}
              </Link>
            )}
            <Link href="/" className="block text-center text-sm text-muted transition-colors hover:text-brand">
              {t("continueShopping")}
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
