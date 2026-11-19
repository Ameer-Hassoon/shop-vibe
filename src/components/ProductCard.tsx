"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Product } from "@/types";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge, Button } from "@/components/ui";
import { StarRating } from "./StarRating";
import { CartIcon, CheckIcon, HeartIcon } from "./icons";
import { useCategoryLabel } from "./categoryLabel";

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useCartStore((state) => state.addToCart);
  const inWishlist = useWishlistStore((state) => state.items.includes(product.id));
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const locale = useLocale();
  const t = useTranslations();
  const categoryLabel = useCategoryLabel();
  const [imageError, setImageError] = useState(false);
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const href = `/product/${product.id}`;
  const rating = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-pop)]">
      <div className="relative">
        <Link href={href} locale={locale} className="block" tabIndex={-1} aria-hidden="true">
          <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
            {imageError ? (
              <div className="flex h-full w-full items-center justify-center text-xs text-subtle">
                {t("common.noImage")}
              </div>
            ) : (
              <Image
                src={product.image}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </Link>
        <Badge className="absolute start-2.5 top-2.5 max-w-[calc(100%-4rem)] bg-surface/90 text-fg shadow-sm backdrop-blur">
          <span className="truncate">{categoryLabel(product.category)}</span>
        </Badge>
        <button
          type="button"
          onClick={() => toggleItem(product.id)}
          aria-label={inWishlist ? t("product.removeFromWishlist") : t("product.addToWishlist")}
          aria-pressed={inWishlist}
          className={cn(
            "absolute end-2.5 top-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition-colors hover:bg-surface",
            inWishlist ? "text-danger" : "text-muted hover:text-fg",
          )}
        >
          <HeartIcon filled={inWishlist} className="h-[18px] w-[18px]" />
        </button>
        {(outOfStock || lowStock) && (
          <Badge
            tone={outOfStock ? "danger" : "warning"}
            className="absolute bottom-2.5 start-2.5 shadow-sm"
          >
            {outOfStock ? t("product.outOfStock") : t("product.onlyLeft", { count: product.stock })}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <Link href={href} locale={locale} className="focus-visible:outline-offset-4">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-fg transition-colors group-hover:text-brand">
            {product.name}
          </h3>
        </Link>
        <div className="flex h-4 items-center gap-1.5">
          {reviewCount > 0 && (
            <>
              <StarRating rating={rating} size="sm" />
              <span className="text-xs text-muted tabular">({reviewCount})</span>
            </>
          )}
        </div>
        <p className="mt-auto pt-1 text-lg font-bold tabular">{formatPrice(product.price, locale)}</p>
        <Button
          type="button"
          size="md"
          variant={added ? "secondary" : "primary"}
          onClick={handleAdd}
          disabled={outOfStock}
          className="w-full gap-1.5 px-3"
        >
          {added ? <CheckIcon className="h-4 w-4 shrink-0" /> : <CartIcon className="h-4 w-4 shrink-0" />}
          <span className="truncate" aria-live="polite">
            {outOfStock ? t("product.outOfStock") : added ? t("product.added") : t("product.addToCart")}
          </span>
        </Button>
      </div>
    </article>
  );
}
