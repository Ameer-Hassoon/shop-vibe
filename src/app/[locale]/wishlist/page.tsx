"use client";

import { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/navigation";
import { useWishlistStore } from "@/store/wishlist";
import { Product } from "@/types";
import Image from "next/image";
import { useLocale } from "next-intl";

export default function WishlistPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { items, isHydrated } = useWishlistStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (items.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const ids = items.join(",");
        const res = await fetch(`/api/products?ids=${ids}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch wishlist products:", error);
      } finally {
        setLoading(false);
      }
    }

    if (isHydrated) {
      fetchProducts();
    }
  }, [items, isHydrated]);

  const removeFromWishlist = useWishlistStore((state) => state.removeItem);

  if (!isHydrated || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('wishlist.myWishlist')}</h1>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('wishlist.myWishlist')}</h1>
        <p className="text-gray-600">{t('wishlist.emptyWishlist')}</p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {t('cart.continueShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('wishlist.myWishlist')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Link href={`/product/${product.id}`} locale={locale}>
              <div className="relative aspect-square">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            </Link>
            <div className="p-4">
              <Link href={`/product/${product.id}`} locale={locale}>
                <h3 className="font-semibold text-lg hover:text-indigo-600">{product.name}</h3>
              </Link>
              <p className="text-gray-600 mt-1">${product.price.toFixed(2)}</p>
              <button
                onClick={() => removeFromWishlist(product.id)}
                className="mt-3 text-red-600 hover:text-red-700 text-sm"
              >
                {t('product.removeFromWishlist')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
