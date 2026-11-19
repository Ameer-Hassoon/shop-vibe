"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useWishlistStore } from "@/store/wishlist";
import { useCartStore } from "@/store/cart";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { buttonClass } from "@/components/ui/Button";
import { AlertIcon, HeartIcon, TrashIcon } from "@/components/account/icons";
import { ProductThumb } from "@/components/checkout/ProductThumb";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types";

const shell = "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8";

export default function WishlistPage() {
  const t = useTranslations("wishlist");
  const tc = useTranslations("common");
  const tCart = useTranslations("cart");
  const locale = useLocale();
  const items = useWishlistStore((s) => s.items);
  const isHydrated = useWishlistStore((s) => s.isHydrated);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const addToCart = useCartStore((s) => s.addToCart);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [added, setAdded] = useState<string | null>(null);

  const idsKey = items.join(",");
  useEffect(() => {
    if (!isHydrated) return;
    if (!idsKey) return;
    const ctrl = new AbortController();
    fetch(`/api/products?ids=${encodeURIComponent(idsKey)}&limit=100`, { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("fetch");
        const data = (await res.json()) as { products?: Product[] };
        setProducts(data.products ?? []);
        setError(false);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(true);
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [idsKey, isHydrated, nonce]);

  const title = <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">{t("myWishlist")}</h1>;

  const visible = products.filter((p) => items.includes(p.id));

  if (!isHydrated || (items.length > 0 && loading)) {
    return (
      <div className={shell} aria-busy="true">
        {title}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
          ))}
        </div>
      </div>
    );
  }

  if (error && items.length > 0) {
    return (
      <div className={shell}>
        {title}
        <Card>
          <EmptyState
            icon={<AlertIcon className="h-7 w-7" />}
            title={t("loadError")}
            description={tc("error")}
            action={<Button onClick={() => { setLoading(true); setNonce((n) => n + 1); }}>{tc("retry")}</Button>}
          />
        </Card>
      </div>
    );
  }

  if (items.length === 0 || visible.length === 0) {
    return (
      <div className={shell}>
        {title}
        <Card>
          <EmptyState
            icon={<HeartIcon className="h-7 w-7" />}
            title={t("emptyWishlist")}
            description={t("emptyHint")}
            action={
              <Link href="/" className={buttonClass("primary", "lg")}>
                {tCart("continueShopping")}
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={shell}>
      {title}
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((p) => {
          const soldOut = p.stock <= 0;
          return (
            <li key={p.id}>
              <Card className="flex h-full flex-col overflow-hidden">
                <Link href={`/product/${p.id}`} className="group relative block">
                  <ProductThumb
                    src={p.image}
                    alt={p.name}
                    className="aspect-square w-full rounded-none"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {soldOut && (
                    <Badge tone="neutral" className="absolute start-3 top-3 bg-surface">{t("soldOut")}</Badge>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <Link href={`/product/${p.id}`} className="line-clamp-2 font-semibold transition-colors hover:text-brand">
                    {p.name}
                  </Link>
                  <p className="tabular mt-1 font-bold">{formatPrice(p.price, locale)}</p>
                  <div className="mt-auto flex gap-2 pt-4">
                    <Button
                      className="flex-1"
                      disabled={soldOut}
                      onClick={() => {
                        addToCart(p);
                        setAdded(p.id);
                      }}
                    >
                      {added === p.id ? t("addedToCart") : t("addToCart")}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={t("removeNamed", { name: p.name })}
                      onClick={() => removeItem(p.id)}
                    >
                      <TrashIcon className="mx-auto" />
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
      <p className="sr-only" role="status">{added ? t("addedToCart") : ""}</p>
    </div>
  );
}
