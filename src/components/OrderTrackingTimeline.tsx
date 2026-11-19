"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { AlertIcon, CheckIcon } from "@/components/account/icons";

interface OrderTrackingTimelineProps {
  status: string;
  estimatedDelivery?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  className?: string;
}

const STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

/**
 * Order progress: horizontal on >= sm, vertical on mobile. Uses logical properties only, so it mirrors in RTL.
 * CANCELLED orders show a notice instead of progress.
 */
export function OrderTrackingTimeline({
  status,
  estimatedDelivery,
  trackingNumber,
  carrier,
  className,
}: OrderTrackingTimelineProps) {
  const t = useTranslations("orders");
  const locale = useLocale();

  if (status === "CANCELLED") {
    return (
      <div role="status" className={cn("flex items-start gap-3 rounded-xl bg-danger-soft p-4 text-danger", className)}>
        <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">{t("status.CANCELLED")}</p>
          <p className="mt-0.5 text-sm">{t("cancelledText")}</p>
        </div>
      </div>
    );
  }

  const found = STEPS.indexOf(status as (typeof STEPS)[number]);
  const current = found === -1 ? 0 : found;
  const delivered = status === "DELIVERED";
  const showEta = estimatedDelivery && !delivered && !Number.isNaN(new Date(estimatedDelivery).getTime());

  return (
    <div className={className}>
      <ol className="grid grid-cols-1 sm:grid-cols-5" aria-label={t("trackOrder")}>
        {STEPS.map((step, i) => {
          const done = i < current || (delivered && i === current);
          const active = i === current && !delivered;
          const last = i === STEPS.length - 1;
          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className="relative flex items-center gap-3 pb-6 last:pb-0 sm:flex-col sm:gap-2 sm:pb-0 sm:text-center"
            >
              {!last && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute start-[15px] top-8 h-[calc(100%-2rem)] w-0.5 sm:start-1/2 sm:top-[15px] sm:h-0.5 sm:w-full",
                    i < current ? "bg-brand" : "bg-line",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                  done && "border-brand bg-brand text-brand-fg",
                  active && "border-brand bg-surface text-brand ring-4 ring-brand-soft",
                  !done && !active && "border-line-strong bg-surface text-subtle",
                )}
              >
                {done ? <CheckIcon className="h-4 w-4" /> : <span className="tabular">{i + 1}</span>}
              </span>
              <span className={cn("text-sm", done || active ? "font-semibold text-fg" : "text-muted")}>
                {t(`status.${step}`)}
                {active && <span className="sr-only"> ({t("inProgress")})</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {(showEta || trackingNumber) && (
        <dl className="mt-6 grid gap-3 rounded-xl bg-surface-2 p-4 text-sm sm:grid-cols-2">
          {showEta && (
            <div>
              <dt className="text-muted">{t("estimatedDelivery")}</dt>
              <dd className="font-semibold">{formatDate(estimatedDelivery as string, locale)}</dd>
            </div>
          )}
          {trackingNumber && (
            <div>
              <dt className="text-muted">{carrier ? t("trackingWithCarrier", { carrier }) : t("trackingNumber")}</dt>
              <dd className="tabular font-semibold" dir="ltr">{trackingNumber}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
