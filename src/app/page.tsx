"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useFilters } from "@/store/filters";
import Link from "next/link";
import { Product } from "@/types";

const CATEGORIES = [
  "Electronics",
  "Computers & Laptops",
  "Phones & Tablets",
  "Cameras & Photography",
  "TV & Home Entertainment",
  "Audio & Headphones",
  "Clothing",
  "Shoes & Footwear",
  "Jewelry & Watches",
  "Bags & Backpacks",
  "Home & Garden",
  "Kitchen & Dining",
  "Furniture",
  "Lighting",
  "Sports & Outdoors",
  "Fitness Equipment",
  "Cycling",
  "Camping & Hiking",
  "Books",
  "Toys & Games",
  "Beauty & Personal Care",
  "Automotive",
  "Pet Supplies",
  "Office Supplies",
];

const ITEMS_PER_PAGE = 20;
const MAX_PRICE = 1000;

function DualRangeSlider({
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  min: number;
  max: number;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
}) {
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const slider = document.getElementById("price-slider");
      if (!slider) return;
      const rect = slider.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
      );
      const value = Math.round(((percentage / 100) * MAX_PRICE) / 10) * 10;
      if (dragging === "min") onMinChange(Math.min(value, max - 10));
      else onMaxChange(Math.max(value, min + 10));
    };
    const handleMouseUp = () => setDragging(null);
    if (dragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, min, max, onMinChange, onMaxChange]);

  const minPercent = (min / MAX_PRICE) * 100;
  const maxPercent = (max / MAX_PRICE) * 100;

  return (
    <div className="px-2" id="price-slider">
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div
          className="absolute h-full bg-indigo-600 rounded-full"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <div
          className="absolute w-5 h-5 bg-white border-2 border-indigo-600 rounded-full -top-1.5 cursor-grab active:cursor-grabbing shadow-md"
          style={{ left: `calc(${minPercent}% - 10px)` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging("min");
          }}
        />
        <div
          className="absolute w-5 h-5 bg-white border-2 border-indigo-600 rounded-full -top-1.5 cursor-grab active:cursor-grabbing shadow-md"
          style={{ left: `calc(${maxPercent}% - 10px)` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging("max");
          }}
        />
      </div>
      <div className="flex justify-between text-sm mt-3">
        <span className="font-medium text-indigo-600">${min}</span>
        <span className="font-medium text-indigo-600">
          ${max === MAX_PRICE ? `${MAX_PRICE}+` : max}
        </span>
      </div>
    </div>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const addToCart = useCartStore((state) => state.addToCart);
  const {
    categories,
    minPrice,
    maxPrice,
    sortBy,
    currentPage,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    setCurrentPage,
    reset,
    toggleCategory,
  } = useFilters();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalFromApi, setTotalFromApi] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const categoryParam = categories.length > 0 ? categories.join(",") : "";
    const url = `/api/products?search=${encodeURIComponent(searchQuery)}${categoryParam ? `&category=${categoryParam}` : ""}&page=1&limit=1000`;
    fetch(url, { cache: "no-store" })
      .then((res) => {
        if (!res.ok)
          throw new Error(
            `Failed to fetch products: ${res.status} ${res.statusText}`,
          );
        return res.json();
      })
      .then((data) => {
        setProducts(data.products || []);
        setTotalFromApi(data.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, [searchQuery, categories, refreshKey]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setRefreshKey((k) => k + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const filtered = useMemo(() => {
    let arr = products.filter(
      (p) => p.price >= minPrice && p.price <= maxPrice,
    );
    if (sortBy === "price-low")
      arr = [...arr].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high")
      arr = [...arr].sort((a, b) => b.price - a.price);
    else if (sortBy === "name")
      arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "newest") {
      arr = [...arr].sort((a, b) => {
        if (!a.createdAt && b.createdAt) return 1;
        if (!b.createdAt && a.createdAt) return -1;
        if (!a.createdAt && !b.createdAt) return 0;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }
    return arr;
  }, [products, minPrice, maxPrice, sortBy]);

  const totalProducts = filtered.length;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // Clamp currentPage if out of range
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
    else if (currentPage < 1 && totalPages > 0) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, totalPages]);

  const displayed = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const hasFilters =
    categories.length > 0 ||
    minPrice > 0 ||
    maxPrice < MAX_PRICE ||
    sortBy !== "newest";

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="text-red-600 font-bold text-lg mb-4">{error}</div>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        <aside className="w-72 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                Categories
              </h2>
              {hasFilters && (
                <button
                  onClick={reset}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left ${categories.includes(cat) ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <span className="text-sm">{cat}</span>
                  {categories.includes(cat) && (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Price Range
              </h3>
              <DualRangeSlider
                min={minPrice}
                max={maxPrice}
                onMinChange={setMinPrice}
                onMaxChange={setMaxPrice}
              />
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              {searchQuery ? (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Results for &quot;
                    <span className="text-indigo-600">{searchQuery}</span>&quot;
                  </h1>
                  <p className="text-gray-500 mt-1">
                    {totalProducts} products found
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">
                    All Products
                  </h1>
                  <p className="text-gray-500 mt-1">
                    {totalProducts} products available
                  </p>
                </>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>

          {hasFilters && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                >
                  {cat}
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
              ))}
              {(minPrice > 0 || maxPrice < MAX_PRICE) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  ${minPrice} - $
                  {maxPrice === MAX_PRICE ? `${MAX_PRICE}+` : maxPrice}
                  <button
                    onClick={() => {
                      setMinPrice(0);
                      setMaxPrice(MAX_PRICE);
                    }}
                    className="hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg">No products found</p>
              <button
                onClick={reset}
                className="text-indigo-600 hover:underline mt-2"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayed.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all"
                  >
                    <Link href={`/product/${product.id}`} className="block">
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/400x400?text=No+Image";
                          }}
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-1 bg-white/90 text-xs font-medium text-gray-700 rounded-md">
                            {product.category}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/product/${product.id}`}>
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
                              Only {product.stock} left
                            </p>
                          )}
                          {product.stock === 0 && (
                            <p className="text-xs text-red-500">Out of stock</p>
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
                          {product.stock > 0 ? "Add" : "Out"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let page = i + 1;
                    if (totalPages > 7 && currentPage > 4)
                      page = currentPage - 3 + i;
                    if (totalPages > 7 && currentPage > totalPages - 3)
                      page = totalPages - 6 + i;
                    return page <= totalPages ? (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 border rounded-lg ${page === currentPage ? "bg-indigo-600 text-white" : ""}`}
                      >
                        {page}
                      </button>
                    ) : null;
                  })}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
