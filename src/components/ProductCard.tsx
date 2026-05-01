"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { translateCategory } from "@/lib/categoryTranslations";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const locale = useLocale();
  const t = useTranslations();
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const [imageError, setImageError] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  }, []);

  return (
    <div
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative">
        <Link href={`/product/${product.id}`} locale={locale} className="block">
          <div
            className="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer"
            onMouseMove={handleMouseMove}
          >
            {imageError ? (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                <span className="text-xs">{t("common.noImage")}</span>
              </div>
            ) : (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className={`object-cover transition-transform duration-300 ease-out ${isHovering ? "scale-125" : "scale-100"}`}
                style={{
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                }}
                onError={() => {
                  setImageError(true);
                }}
              />
            )}
            <div className="absolute top-2 left-2 z-10">
              <span className="px-2 py-1 bg-white/90 text-xs font-medium text-gray-700 rounded-md product-card-category">
                {translateCategory(product.category, t)}
              </span>
            </div>
            {isHovering && (
              <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            )}
          </div>
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleItem(product.id);
          }}
          aria-label={
            inWishlist ? t("product.removeFromWishlist") : t("product.addToWishlist")
          }
          className="absolute top-2 right-2 z-20 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
        >
          <svg
            className={`w-5 h-5 ${inWishlist ? "text-red-500 fill-red-500" : "text-gray-600"}`}
            fill={inWishlist ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <Link href={`/product/${product.id}`} locale={locale}>
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </p>
            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-xs text-orange-500">
                {t("product.onlyLeft", { count: product.stock })}
              </p>
            )}
            {product.stock === 0 && (
              <p className="text-xs text-red-500">{t("product.outOfStock")}</p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            disabled={product.stock <= 0}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {product.stock > 0 ? t("product.addToCart") : t("product.outOfStock")}
          </button>
        </div>
      </div>
    </div>
  );
}
