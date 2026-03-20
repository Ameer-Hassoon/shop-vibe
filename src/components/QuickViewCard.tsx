"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { useLanguage } from "@/store/language";
import { StarRating } from "./StarRating";

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
  const { translateCategory } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [rating, setRating] = useState(initialRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setRating(initialRating);
    setReviewCount(initialReviewCount);

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
  }, [product.id, initialRating, initialReviewCount]);

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

  const description =
    product.description.length > 100
      ? product.description.substring(0, 100) + "..."
      : product.description;

  return (
    <div
      ref={cardRef}
      className="fixed z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn"
      style={{ top: adjustedPosition.top, left: adjustedPosition.left }}
    >
      <div className="absolute -left-2 top-6 w-4 h-4 bg-white border-l border-b border-gray-200 transform rotate-45" />

      <div className="relative h-48 bg-gray-50">
        {imageError ? (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
            <span className="text-xs">No image</span>
          </div>
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="320px"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        )}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-white/90 text-xs font-medium text-gray-700 rounded-md">
            {translateCategory(product.category)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <Link
          href={`/product/${product.id}`}
          onClick={onClose}
          className="block"
        >
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={rating} size="sm" />
          {reviewCount > 0 && (
            <span className="text-xs text-gray-500">({reviewCount})</span>
          )}
        </div>

        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{description}</p>

        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-xl font-bold text-gray-900">
              ${Number(product.price ?? 0).toFixed(2)}
            </p>
            {product.stock > 0 ? (
              <p className="text-xs text-green-600 font-medium">
                {product.stock <= 5 ? `Only ${product.stock} left` : "In Stock"}
              </p>
            ) : (
              <p className="text-xs text-red-500 font-medium">Out of Stock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
