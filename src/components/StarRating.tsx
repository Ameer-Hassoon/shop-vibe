"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  id?: string;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeClasses = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" } as const;

const STAR_PATH =
  "m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5Z";

function Star({ fill, size }: { fill: number; size: keyof typeof sizeClasses }) {
  const cls = sizeClasses[size];
  const svg = (color: string, extra?: string) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn(cls, "shrink-0", color, extra)}>
      <path d={STAR_PATH} fill="currentColor" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" />
    </svg>
  );
  return (
    <span className={cn("relative inline-block", cls)}>
      {svg("text-line-strong")}
      {fill > 0 && (
        <span
          className="absolute inset-y-0 start-0 overflow-hidden"
          style={{ width: `${Math.min(1, fill) * 100}%` }}
        >
          {svg("text-accent")}
        </span>
      )}
    </span>
  );
}

/** Read-only or interactive 1..5 star rating. Partial fill mirrors in RTL. */
export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  id,
  onChange,
  className,
}: StarRatingProps) {
  const t = useTranslations();
  const [hover, setHover] = useState(0);
  const shown = interactive && hover > 0 ? hover : rating;

  const stars = Array.from({ length: maxRating }, (_, index) => {
    const fill = Math.max(0, Math.min(1, shown - index));
    if (!interactive) return <Star key={index} fill={fill} size={size} />;
    return (
      <button
        key={index}
        id={index === 0 ? id : undefined}
        type="button"
        onClick={() => onChange?.(index + 1)}
        onMouseEnter={() => setHover(index + 1)}
        onMouseLeave={() => setHover(0)}
        aria-label={t("review.rateStars", { rating: index + 1, maxRating })}
        aria-pressed={rating === index + 1}
        className="rounded p-0.5 transition-transform hover:scale-110"
      >
        <Star fill={fill} size={size} />
      </button>
    );
  });

  if (interactive) {
    return (
      <div role="group" className={cn("inline-flex items-center gap-0.5", className)}>
        {stars}
      </div>
    );
  }

  return (
    <span
      role="img"
      aria-label={t("review.ratedOf", { rating: Number(rating.toFixed(1)), maxRating })}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {stars}
    </span>
  );
}
