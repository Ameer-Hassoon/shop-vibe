"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFilters } from "@/store/filters";
import { Product } from "@/types";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductGridSkeleton } from "@/components/ProductGridSkeleton";
import { FilterSidebar } from "@/components/FilterSidebar";
import { Pagination } from "@/components/Pagination";
import { useTranslations } from 'next-intl';
import { translateCategory } from "@/lib/categoryTranslations";

const ITEMS_PER_PAGE = 20;
const MAX_PRICE = 1000;

const CATEGORY_KEY_TO_NAME: Record<string, string> = {
  "cat.electronics": "Electronics",
  "cat.computers": "Computers & Laptops",
  "cat.phones": "Phones & Tablets",
  "cat.cameras": "Cameras & Photography",
  "cat.tv": "TV & Home Entertainment",
  "cat.audio": "Audio & Headphones",
  "cat.clothing": "Clothing",
  "cat.shoes": "Shoes & Footwear",
  "cat.jewelry": "Jewelry & Watches",
  "cat.bags": "Bags & Backpacks",
  "cat.home": "Home & Garden",
  "cat.kitchen": "Kitchen & Dining",
  "cat.furniture": "Furniture",
  "cat.lighting": "Lighting",
  "cat.sports": "Sports & Outdoors",
  "cat.fitness": "Fitness Equipment",
  "cat.cycling": "Cycling",
  "cat.camping": "Camping & Hiking",
  "cat.books": "Books",
  "cat.toys": "Toys & Games",
  "cat.beauty": "Beauty & Personal Care",
  "cat.automotive": "Automotive",
  "cat.pets": "Pet Supplies",
  "cat.office": "Office Supplies",
};

function HomePageContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const {
    categories,
    minPrice,
    maxPrice,
    inStockOnly,
    sortBy,
    currentPage,
    minRating,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    setCurrentPage,
    reset,
    toggleCategory,
  } = useFilters();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mountedTimer = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(mountedTimer);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      reset();
    }
  }, [searchQuery, reset]);

  useEffect(() => {
    const loadingTimer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    const categoryNames = categories.map(cat => CATEGORY_KEY_TO_NAME[cat] || cat);
    const encodedCategoryNames = categoryNames.map(cat => encodeURIComponent(cat));
    const categoryParam = encodedCategoryNames.length > 0 ? encodedCategoryNames.join(",") : "";
    const inStockParam = inStockOnly ? "&inStock=true" : "";
    const minPriceParam = minPrice > 0 ? `&minPrice=${minPrice}` : "";
    const maxPriceParam = maxPrice < MAX_PRICE ? `&maxPrice=${maxPrice}` : "";
    const minRatingParam = minRating > 0 ? `&minRating=${minRating}` : "";
    const url = `/api/products?search=${encodeURIComponent(searchQuery)}${categoryParam ? `&category=${categoryParam}` : ""}${inStockParam}${minPriceParam}${maxPriceParam}${minRatingParam}&sortBy=${sortBy}&page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
    
    fetch(url)
      .then((res) => {
        if (!res.ok)
          throw new Error(
            `Failed to fetch products: ${res.status} ${res.statusText}`,
          );
        return res.json();
      })
      .then((data) => {
        setProducts(data.products || []);
        setTotalProducts(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });

    return () => {
      window.clearTimeout(loadingTimer);
    };
  }, [searchQuery, categories, inStockOnly, sortBy, refreshKey, currentPage, minPrice, maxPrice, minRating]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
    else if (currentPage < 1 && totalPages > 0) setCurrentPage(1);
  }, [currentPage, totalPages, setCurrentPage]);

  const displayed = products;

  const hasFilters =
    categories.length > 0 ||
    minPrice > 0 ||
    maxPrice < MAX_PRICE ||
    minRating > 0 ||
    inStockOnly ||
    sortBy !== "newest";

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="text-red-600 font-bold text-lg mb-4">{error}</div>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5 h-96 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="h-12 bg-gray-200 rounded-lg w-64 animate-pulse mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: Math.min(ITEMS_PER_PAGE, 20) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-200 h-72 animate-pulse"
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        <FilterSidebar />

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              {searchQuery ? (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {t("home.resultsFor")} &quot;
                    <span className="text-indigo-600">{searchQuery}</span>&quot;
                  </h1>
                  <p className="text-gray-500 mt-1">
                    {t("home.productsFound", { count: totalProducts })}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {t('nav.newArrivals')}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    {t("home.productsFound", { count: totalProducts })}
                  </p>
                </>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="newest">{t('product.newest')}</option>
              <option value="price-low">{t('product.priceAsc')}</option>
              <option value="price-high">{t('product.priceDesc')}</option>
              <option value="name">{t("home.nameAsc")}</option>
              <option value="rating">{t('product.rating')}</option>
            </select>
          </div>

          {hasFilters && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                >
                  {translateCategory(CATEGORY_KEY_TO_NAME[cat] || cat, t)}
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
              {minRating > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  {t("home.starsUp", { rating: minRating })}
                  <button
                    onClick={() => {
                      useFilters.getState().setMinRating(0);
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
            <ProductGridSkeleton />
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
              <p className="text-gray-500 text-lg">{t('product.noProducts')}</p>
              <button
                onClick={reset}
                className="text-indigo-600 hover:underline mt-2"
              >
                {t('product.clearFilters')}
              </button>
            </div>
          ) : (
            <>
              <ProductGrid products={displayed} />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
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
