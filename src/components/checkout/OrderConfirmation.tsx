"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { CashIcon, CheckIcon } from "@/components/account/icons";
import { PriceBreakdown } from "./PriceBreakdown";
import { ProductThumb } from "./ProductThumb";
import { orderBreakdown, orderNumber, type OrderDto } from "./orderTypes";

/** Shown after a successful POST /api/orders. Displays the server's numbers, never the local preview. */
export function OrderConfirmation({ order }: { order: OrderDto }) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const b = orderBreakdown(order);

  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckIcon className="h-8 w-8" />
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none sm:text-3xl">
          {t("orderConfirmedTitle")}
        </h1>
        <p className="mt-2 text-muted">{t("thankYou")}</p>
        <p className="mt-3 rounded-full bg-surface-2 px-4 py-1.5 text-sm">
          {t("orderNumberLabel")} <span className="tabular font-bold" dir="ltr">#{orderNumber(order.id)}</span>
        </p>
      </div>

      <div className="space-y-5">
        <Card className="flex gap-3 border-brand/30 bg-brand-soft p-4 sm:p-5">
          <CashIcon className="mt-0.5 h-6 w-6 shrink-0 text-brand" />
          <div>
            <p className="font-semibold text-brand">{t("cashOnDelivery")}</p>
            <p className="mt-0.5 text-sm text-fg">
              {t("codReminder", { amount: formatPrice(order.total, locale) })}
            </p>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">{t("itemsHeading")}</h2>
          <ul className="divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <ProductThumb src={item.product?.image} alt={item.product?.name ?? ""} className="h-14 w-14" sizes="56px" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">{item.product?.name}</p>
                  <p className="tabular text-xs text-muted">
                    {formatPrice(item.price, locale)} × {item.quantity}
                  </p>
                </div>
                <p className="tabular text-sm font-semibold">{formatPrice(item.price * item.quantity, locale)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-line pt-5">
            <PriceBreakdown values={b} couponCode={order.coupon?.code} />
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-2 text-lg font-semibold">{t("deliveringTo")}</h2>
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
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`/orders/${order.id}`} className={buttonClass("primary", "lg")}>
            {t("viewOrder")}
          </Link>
          <Link href="/" className={buttonClass("outline", "lg")}>
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}
