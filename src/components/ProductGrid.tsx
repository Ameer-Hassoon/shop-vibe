"use client";

import { useState, useCallback, useRef } from "react";
import { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { QuickViewCard } from "./QuickViewCard";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });
  const [productRect, setProductRect] = useState<DOMRect | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleProductHover = useCallback((
    product: Product,
    event: React.MouseEvent,
    rect: DOMRect
  ) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredProduct(product);
      setProductRect(rect);
      
      const offsetX = 16;
      const offsetY = -100;
      
      let left = rect.right + offsetX;
      let top = rect.top + offsetY;
      
      if (typeof window !== 'undefined') {
        if (left + 320 > window.innerWidth - 20) {
          left = rect.left - 320 - offsetX;
        }
        if (top < 20) {
          top = rect.top;
        }
      }
      
      setHoverPosition({ top, left });
    }, 150);
  }, []);

  const handleProductLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredProduct(null);
    setProductRect(null);
  }, []);

  return (
    <div className="relative">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              handleProductHover(product, e, rect);
            }}
            onMouseLeave={handleProductLeave}
          >
            <ProductCard 
            product={product} 
            rating={product.averageRating} 
            reviewCount={product.reviewCount} 
          />
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

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
