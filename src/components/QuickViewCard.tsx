"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { StarRating } from "./StarRating";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui";
import { useCategoryLabel } from "./categoryLabel";

interface QuickViewCardProps {
  product: Product;
  position: { top: number; left: number };
  productRect: DOMRect;
  rating?: number;
  reviewCount?: number;
  onClose: () => void;
}

export function QuickViewCard({
  product,
  position,
  productRect,
  rating: initialRating = 0,
  reviewCount: initialReviewCount = 0,
  onClose,
}: QuickViewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [rating, setRating] = useState(initialRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [imageError, setImageError] = useState(false);
  const locale = useLocale();
  const t = useTranslations();
  const categoryLabel = useCategoryLabel();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Start from the props again whenever the product or its initial numbers change.
  const propsKey = `${product.id}|${initialRating}|${initialReviewCount}`;
  const [shownKey, setShownKey] = useState(propsKey);
  if (shownKey !== propsKey) {
    setShownKey(propsKey);
    setRating(initialRating);
    setReviewCount(initialReviewCount);
  }

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/products/${product.id}/reviews`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch reviews: ${res.status}`);
        }
        const data = await res.json();
        if (data.summary) {
          setRating(data.summary.averageRating);
          setReviewCount(data.summary.totalReviews);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Failed to fetch review summary:", error);
        } else if (!(error instanceof Error)) {
          console.error("Failed to fetch review summary:", error);
        }
      }
    })();

    return () => controller.abort();
  }, [product.id]);

  useEffect(() => {
    if (cardRef.current) {
      const card = cardRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = position.top;
      let left = position.left;

      if (left + card.width > viewportWidth - 20) {
        left = productRect.left - card.width - 16;
      }

      if (top + card.height > viewportHeight - 20) {
        top = Math.max(20, viewportHeight - card.height - 20);
      }

      if (left < 20) {
        left = productRect.right + 16;
      }

      setAdjustedPosition({ top, left });
    }
  }, [position, productRect]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const full = product.description ?? "";
  const description = full.length > 100 ? full.substring(0, 100) + "..." : full;

  return (
    <div
      ref={cardRef}
      role="tooltip"
      className={`fixed z-50 w-80 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-pop)] transition-all duration-200 ${shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      style={{ top: adjustedPosition.top, left: adjustedPosition.left }}
    >
      <div className="relative aspect-[16/10] bg-surface-2">
        {imageError ? (
          <div className="flex h-full w-full items-center justify-center text-xs text-subtle">
            {t("common.noImage")}
          </div>
        ) : (
          <Image
            src={product.image}
            alt=""
            fill
            sizes="320px"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        )}
        <Badge className="absolute start-2.5 top-2.5 bg-surface/90 text-fg shadow-sm">
          {categoryLabel(product.category)}
        </Badge>
      </div>

      <div className="p-4">
        <Link href={`/product/${product.id}`} locale={locale} onClick={onClose} className="block">
          <h3 className="line-clamp-2 font-semibold text-fg transition-colors hover:text-brand">
            {product.name}
          </h3>
        </Link>

        {reviewCount > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <StarRating rating={rating} size="sm" />
            <span className="text-xs text-muted tabular">({reviewCount})</span>
          </div>
        )}

        {description && <p className="mt-2 line-clamp-2 text-sm text-muted">{description}</p>}

        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-lg font-bold tabular">{formatPrice(Number(product.price ?? 0), locale)}</p>
          {product.stock > 0 ? (
            <p className={`text-xs font-medium ${product.stock <= 5 ? "text-warning" : "text-success"}`}>
              {product.stock <= 5 ? t("product.onlyLeft", { count: product.stock }) : t("product.inStock")}
            </p>
          ) : (
            <p className="text-xs font-medium text-danger">{t("product.outOfStock")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
