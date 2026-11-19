"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Input } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import type { PricingCoupon } from "@/lib/pricing";
import { TagIcon, XIcon } from "@/components/account/icons";

export interface AppliedCoupon extends PricingCoupon {
  code: string;
}

/** Promo code input with apply / remove. Validation happens server-side via GET /api/coupons. */
export function CouponBox({
  subtotal,
  coupon,
  onApply,
  onRemove,
  externalError,
  notice,
}: {
  subtotal: number;
  coupon: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
  /** Error pushed from the parent (for example COUPON_INVALID on submit). */
  externalError?: string;
  notice?: string;
}) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    const value = code.trim().toUpperCase();
    if (!value) {
      setError(t("couponEnter"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(value)}&cartTotal=${subtotal.toFixed(2)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.valid === false) {
        setError(typeof data.error === "string" ? data.error : t("couponFailed"));
        return;
      }
      onApply({
        code: typeof data.code === "string" ? data.code : value,
        type: data.type,
        value: Number(data.value) || 0,
        minPurchase: Number(data.minPurchase) || 0,
        maxDiscount: data.maxDiscount ?? null,
        freeShipping: Boolean(data.freeShipping),
      });
      setCode("");
    } catch {
      setError(t("couponFailed"));
    } finally {
      setLoading(false);
    }
  }

  const shownError = error || externalError;

  return (
    <div>
      <label htmlFor="coupon-code" className="mb-1.5 block text-sm font-medium">
        {t("couponLabel")}
      </label>
      {coupon ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand-soft px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-brand">
            <TagIcon className="h-4 w-4 shrink-0" />
            <span className="truncate" dir="ltr">{coupon.code}</span>
            <span className="sr-only">{t("couponApplied")}</span>
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label={t("removeCoupon", { code: coupon.code })}
            className="flex h-8 w-8 items-center justify-center rounded-full text-brand transition-colors hover:bg-surface/60"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // Not a <form>: this box sits inside the checkout form, and nested forms are invalid HTML.
        <div className="flex gap-2">
          <Input
            id="coupon-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // don't submit the surrounding checkout form
                if (code.trim()) void apply();
              }
            }}
            placeholder={t("couponPlaceholder")}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            dir="ltr"
            aria-invalid={shownError ? true : undefined}
            aria-describedby={shownError ? "coupon-msg" : undefined}
            className="min-w-0 uppercase placeholder:normal-case"
          />
          <Button type="button" onClick={() => void apply()} variant="outline" loading={loading} disabled={!code.trim()}>
            {t("apply")}
          </Button>
        </div>
      )}
      {coupon && coupon.minPurchase > 0 && (
        <p className="mt-1.5 text-xs text-muted">{t("couponMin", { amount: formatPrice(coupon.minPurchase, locale) })}</p>
      )}
      {shownError && !coupon && (
        <p id="coupon-msg" role="alert" className="mt-1.5 text-xs text-danger">
          {shownError}
        </p>
      )}
      {notice && !coupon && (
        <p role="status" className="mt-1.5 text-xs text-warning">
          {notice}
        </p>
      )}
    </div>
  );
}
