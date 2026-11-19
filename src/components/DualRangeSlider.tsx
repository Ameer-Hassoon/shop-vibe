"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

const MAX_PRICE = 1000;
const STEP = 10;

interface DualRangeSliderProps {
  min: number;
  max: number;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function DualRangeSlider({ min, max, onMinChange, onMaxChange }: DualRangeSliderProps) {
  const t = useTranslations("filters");
  const locale = useLocale();
  const rtl = locale === "ar";
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<"min" | "max" | null>(null);

  const money = (v: number) =>
    new Intl.NumberFormat(`${locale}-u-nu-latn`, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v) + (v === MAX_PRICE ? "+" : "");

  const valueAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    const ratio = rtl ? (rect.right - clientX) / rect.width : (clientX - rect.left) / rect.width;
    return Math.round((clamp(ratio, 0, 1) * MAX_PRICE) / STEP) * STEP;
  };

  const move = (which: "min" | "max", value: number) => {
    if (which === "min") onMinChange(clamp(value, 0, max - STEP));
    else onMaxChange(clamp(value, min + STEP, MAX_PRICE));
  };

  const onKeyDown = (which: "min" | "max") => (e: React.KeyboardEvent) => {
    const current = which === "min" ? min : max;
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const backward = rtl ? "ArrowRight" : "ArrowLeft";
    let next: number | null = null;
    if (e.key === forward || e.key === "ArrowUp") next = current + STEP;
    else if (e.key === backward || e.key === "ArrowDown") next = current - STEP;
    else if (e.key === "PageUp") next = current + STEP * 10;
    else if (e.key === "PageDown") next = current - STEP * 10;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = MAX_PRICE;
    if (next === null) return;
    e.preventDefault();
    move(which, next);
  };

  const pointerHandlers = (which: "min" | "max") => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.focus();
      setActive(which);
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (active === which) move(which, valueAt(e.clientX));
    },
    onPointerUp: () => setActive(null),
    onPointerCancel: () => setActive(null),
  });

  const minPct = (min / MAX_PRICE) * 100;
  const maxPct = (max / MAX_PRICE) * 100;
  const thumb =
    "absolute top-1/2 h-5 w-5 -translate-y-1/2 touch-none rounded-full border-2 border-brand bg-surface shadow-md " +
    "cursor-grab active:cursor-grabbing";

  return (
    <div>
      <div className="px-2.5">
        <div className="relative h-8" ref={trackRef}>
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-2" />
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
            style={{ insetInlineStart: `${minPct}%`, insetInlineEnd: `${100 - maxPct}%` }}
          />
          {(["min", "max"] as const).map((which) => {
            const value = which === "min" ? min : max;
            const pct = which === "min" ? minPct : maxPct;
            return (
              <div
                key={which}
                role="slider"
                aria-label={t(which === "min" ? "minimumValue" : "maximumValue")}
                aria-valuemin={which === "min" ? 0 : min + STEP}
                aria-valuemax={which === "min" ? max - STEP : MAX_PRICE}
                aria-valuenow={value}
                aria-valuetext={money(value)}
                tabIndex={0}
                className={cn(thumb, active === which && "ring-4 ring-brand/20", "-ms-2.5")}
                style={{ insetInlineStart: `${pct}%`, zIndex: which === "min" && minPct > 90 ? 2 : 1 }}
                onKeyDown={onKeyDown(which)}
                {...pointerHandlers(which)}
              />
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm font-semibold tabular">
        <span>{money(min)}</span>
        <span>{money(max)}</span>
      </div>
    </div>
  );
}
