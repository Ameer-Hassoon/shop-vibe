"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { Product } from "@/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge, Button, Card, buttonClass } from "@/components/ui";
import { StarRating } from "./StarRating";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { ProductCard } from "./ProductCard";
import { useCategoryLabel } from "./categoryLabel";
import { CartIcon, CheckIcon, ChevronEndIcon, HeartIcon, MinusIcon, PlusIcon, AlertIcon } from "./icons";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string | null;
  user: { id: string; name: string | null };
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

export function ProductDetail({ product }: { product: Product }) {
  const t = useTranslations();
  const locale = useLocale();
  const categoryLabel = useCategoryLabel();
  const { data: session } = useSession();
  const addToCart = useCartStore((s) => s.addToCart);
  const inCart = useCartStore((s) => s.items.find((i) => i.productId === product.id)?.quantity ?? 0);
  const inWishlistRaw = useWishlistStore((s) => s.items.includes(product.id));
  const toggleItem = useWishlistStore((s) => s.toggleItem);

  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [related, setRelated] = useState<Product[]>([]);

  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const inWishlist = mounted && inWishlistRaw;
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const maxAddable = Math.max(0, product.stock - (mounted ? inCart : 0));
  const qty = Math.min(quantity, Math.max(1, maxAddable));

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const json = (res: Response) => (res.ok ? res.json() : null);

    fetch(`/api/products/${product.id}/reviews`, { signal })
      .then(json)
      .then((data) => {
        setReviews(data?.reviews || []);
        setSummary(data?.summary || null);
      })
      .catch(() => {})
      .finally(() => {
        if (!signal.aborted) setReviewsLoading(false);
      });

    (async () => {
      try {
        const recs = await fetch(`/api/products/${product.id}/recommendations`, { signal }).then(json);
        const merged: Product[] = [...(recs?.frequentlyBoughtTogether ?? []), ...(recs?.trending ?? [])];
        let list = merged.filter((p, i) => p.id !== product.id && merged.findIndex((q) => q.id === p.id) === i);
        if (list.length < 4) {
          const data = await fetch(
            `/api/products?category=${encodeURIComponent(product.category)}&limit=12`,
            { signal },
          ).then(json);
          const sameCategory: Product[] = (data?.products ?? []).filter(
            (p: Product) => p.id !== product.id && !list.some((q) => q.id === p.id),
          );
          list = [...list, ...sameCategory];
        }
        if (!signal.aborted) setRelated(list.slice(0, 4));
      } catch {
        /* recommendations are optional */
      }
    })();

    return () => controller.abort();
  }, [product.id, product.category]);

  const refreshReviews = async () => {
    setShowReviewForm(false);
    setEditingReview(null);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setReviews(data.reviews || []);
      setSummary(data.summary || null);
    } catch {
      /* keep what is shown */
    }
  };

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setQuantity(1);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const total = summary?.totalReviews ?? 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <nav aria-label={t("product.breadcrumb")} className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
          <li>
            <Link href="/" locale={locale} className="transition-colors hover:text-fg">
              {t("common.home")}
            </Link>
          </li>
          <ChevronEndIcon className="h-4 w-4 text-subtle" />
          <li>
            <Link
              href={`/?category=${encodeURIComponent(product.category)}`}
              locale={locale}
              className="transition-colors hover:text-fg"
            >
              {categoryLabel(product.category)}
            </Link>
          </li>
          <ChevronEndIcon className="h-4 w-4 text-subtle" />
          <li aria-current="page" className="min-w-0 max-w-full truncate font-medium text-fg">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-14">
        <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-2 sm:aspect-[4/3] lg:aspect-[4/5]">
          {imageError ? (
            <div className="flex h-full items-center justify-center text-sm text-subtle">{t("common.noImage")}</div>
          ) : (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        <div className="lg:sticky lg:top-24">
          <Badge tone="brand">{categoryLabel(product.category)}</Badge>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex h-6 items-center gap-2">
            {summary && total > 0 ? (
              <a href="#reviews" className="flex items-center gap-2 text-sm text-muted hover:text-fg">
                <StarRating rating={summary.averageRating} />
                <span className="tabular">
                  {summary.averageRating.toFixed(1)} ({total} {t("product.reviews")})
                </span>
              </a>
            ) : (
              !reviewsLoading && <span className="text-sm text-muted">{t("product.noRatingsYet")}</span>
            )}
          </div>

          <p className="mt-5 text-3xl font-bold tabular">{formatPrice(product.price, locale)}</p>

          <p
            className={cn(
              "mt-3 flex items-center gap-2 text-sm font-medium",
              outOfStock ? "text-danger" : lowStock ? "text-warning" : "text-success",
            )}
          >
            {outOfStock ? <AlertIcon className="h-[18px] w-[18px]" /> : <CheckIcon className="h-[18px] w-[18px]" />}
            {outOfStock
              ? t("product.outOfStock")
              : lowStock
                ? t("product.onlyLeft", { count: product.stock })
                : t("product.inStock")}
          </p>

          <p className="mt-6 max-w-prose leading-relaxed text-muted">{product.description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label={t("product.quantity")}
              className="inline-flex h-12 items-center rounded-[var(--radius-control)] border border-line bg-surface"
            >
              <button
                type="button"
                aria-label={t("product.decreaseQuantity")}
                onClick={() => setQuantity(Math.max(1, qty - 1))}
                disabled={outOfStock || qty <= 1}
                className="flex h-full w-11 items-center justify-center rounded-s-[var(--radius-control)] transition-colors hover:bg-surface-2 disabled:opacity-40"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold tabular" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                aria-label={t("product.increaseQuantity")}
                onClick={() => setQuantity(Math.min(maxAddable, qty + 1))}
                disabled={outOfStock || qty >= maxAddable}
                className="flex h-full w-11 items-center justify-center rounded-e-[var(--radius-control)] transition-colors hover:bg-surface-2 disabled:opacity-40"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={handleAdd}
              disabled={outOfStock || maxAddable <= 0}
              variant={added ? "secondary" : "primary"}
              className="min-w-0 flex-1 basis-40"
            >
              {added ? <CheckIcon className="h-5 w-5" /> : <CartIcon className="h-5 w-5" />}
              {outOfStock
                ? t("product.outOfStock")
                : added
                  ? t("product.added")
                  : maxAddable <= 0
                    ? t("product.maxInCart")
                    : t("product.addToCart")}
            </Button>

            <button
              type="button"
              onClick={() => toggleItem(product.id)}
              aria-pressed={inWishlist}
              aria-label={inWishlist ? t("product.removeFromWishlist") : t("product.addToWishlist")}
              className={cn(
                "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] border transition-colors",
                inWishlist
                  ? "border-danger/40 bg-danger-soft text-danger"
                  : "border-line-strong bg-surface text-fg hover:bg-surface-2",
              )}
            >
              <HeartIcon filled={inWishlist} />
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-6 text-xl font-semibold sm:text-2xl">
            {t("product.youMayAlsoLike")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section id="reviews" className="mt-16 scroll-mt-28 border-t border-line pt-10" aria-labelledby="reviews-heading">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 id="reviews-heading" className="text-xl font-semibold sm:text-2xl">
            {t("product.reviews")} <span className="text-muted tabular">({total})</span>
          </h2>
          {session && !showReviewForm && (
            <Button variant="outline" onClick={() => setShowReviewForm(true)}>
              {t("product.writeReview")}
            </Button>
          )}
        </div>

        {summary && total > 0 && (
          <Card className="mb-8 p-5 sm:p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
              <div className="flex flex-col items-center gap-1.5 sm:min-w-32">
                <p className="text-5xl font-bold tabular">{summary.averageRating.toFixed(1)}</p>
                <StarRating rating={summary.averageRating} size="md" />
                <p className="text-sm text-muted tabular">
                  {total} {t("product.reviews")}
                </p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.distribution?.[star] || 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <span className="w-12 shrink-0 text-muted tabular">
                        {star} {t("review.star")}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 shrink-0 text-end text-muted tabular">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {showReviewForm && (
          <Card className="mb-8 p-5 sm:p-6">
            <h3 className="mb-4 font-semibold">
              {editingReview ? t("review.editReview") : t("product.writeReview")}
            </h3>
            <ReviewForm
              productId={product.id}
              editingReview={editingReview}
              onSubmit={refreshReviews}
              onCancel={() => {
                setShowReviewForm(false);
                setEditingReview(null);
              }}
            />
          </Card>
        )}

        {reviewsLoading ? (
          <div className="space-y-6" role="status" aria-label={t("common.loading")}>
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-surface-2" />
                  <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          !showReviewForm && (
            <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong px-6 py-10 text-center">
              <p className="text-muted">{t("review.noReviewsYet")}</p>
              {session ? (
                <Button className="mt-4" onClick={() => setShowReviewForm(true)}>
                  {t("review.beFirstToReview")}
                </Button>
              ) : (
                <Link href="/login" locale={locale} className={buttonClass("outline", "md", "mt-4")}>
                  {t("review.signInToReview")}
                </Link>
              )}
            </div>
          )
        ) : (
          <div className="divide-y divide-line">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserId={currentUserId}
                onEdit={(r) => {
                  setEditingReview(r);
                  setShowReviewForm(true);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
