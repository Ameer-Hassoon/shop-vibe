"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { QuickViewCard } from "./QuickViewCard";

export const ProductGridClasses = "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });
  const [productRect, setProductRect] = useState<DOMRect | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleProductHover = useCallback(
    (product: Product, event: React.MouseEvent, rect: DOMRect) => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      // Quick view is a mouse affordance; skip it on touch devices.
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredProduct(product);
        setProductRect(rect);

        const offsetX = 16;
        const offsetY = -100;

        let left = rect.right + offsetX;
        let top = rect.top + offsetY;

        if (typeof window !== "undefined") {
          if (left + 320 > window.innerWidth - 20) {
            left = rect.left - 320 - offsetX;
          }
          if (top < 20) {
            top = rect.top;
          }
        }

        setHoverPosition({ top, left });
      }, 150);
    },
    [],
  );

  const handleProductLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredProduct(null);
    setProductRect(null);
  }, []);

  // Ensure we clear timeouts when the component unmounts to avoid state updates on unmounted component
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className={ProductGridClasses}>
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-0"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              handleProductHover(product, e, rect);
            }}
            onMouseLeave={handleProductLeave}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {hoveredProduct && productRect && (
        <QuickViewCard
          product={hoveredProduct}
          position={hoverPosition}
          productRect={productRect}
          rating={hoveredProduct.averageRating || 0}
          reviewCount={hoveredProduct.reviewCount || 0}
          onClose={handleProductLeave}
        />
      )}
    </div>
  );
}
