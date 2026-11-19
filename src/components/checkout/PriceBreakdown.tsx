"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";

export interface BreakdownValues {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  codFee: number;
  total: number;
}

function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "success";
  strong?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", strong ? "text-base font-bold text-fg" : "text-sm")}>
      <dt className={cn(strong ? "" : "text-muted")}>{label}</dt>
      <dd className={cn("tabular", strong ? "text-lg" : "font-medium", tone === "success" && "text-success")}>
        {value}
      </dd>
    </div>
  );
}

/** Subtotal / discount / shipping / tax / COD fee / total. Used by cart, checkout, confirmation and order detail. */
export function PriceBreakdown({
  values,
  couponCode,
  hideZeroCodFee = true,
  totalLabel,
}: {
  values: BreakdownValues;
  couponCode?: string | null;
  hideZeroCodFee?: boolean;
  totalLabel?: string;
}) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const money = (n: number) => formatPrice(n, locale);

  return (
    <dl className="space-y-2.5">
      <Row label={t("subtotal")} value={money(values.subtotal)} />
      {values.discount > 0 && (
        <Row
          tone="success"
          label={
            couponCode ? t("discountWithCode", { code: couponCode }) : t("discount")
          }
          value={<span dir="ltr">−{money(values.discount)}</span>}
        />
      )}
      <Row
        label={t("shipping")}
        value={values.shipping > 0 ? money(values.shipping) : <span className="text-success">{t("free")}</span>}
      />
      <Row label={t("tax")} value={money(values.tax)} />
      {(values.codFee > 0 || !hideZeroCodFee) && <Row label={t("codFee")} value={money(values.codFee)} />}
      <div className="border-t border-line pt-3">
        <Row strong label={totalLabel ?? t("total")} value={money(values.total)} />
      </div>
    </dl>
  );
}
