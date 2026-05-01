"use client";

import { useState } from "react";
import { useFilters, MAX_PRICE } from "@/store/filters";
import { DualRangeSlider } from "./DualRangeSlider";
import { StarRating } from "./StarRating";

const CATEGORY_KEYS = [
  "cat.electronics",
  "cat.computers",
  "cat.phones",
  "cat.cameras",
  "cat.tv",
  "cat.audio",
  "cat.clothing",
  "cat.shoes",
  "cat.jewelry",
  "cat.bags",
  "cat.home",
  "cat.kitchen",
  "cat.furniture",
  "cat.lighting",
  "cat.sports",
  "cat.fitness",
  "cat.cycling",
  "cat.camping",
  "cat.books",
  "cat.toys",
  "cat.beauty",
  "cat.automotive",
  "cat.pets",
  "cat.office",
] as const;

const CATEGORY_NAMES: Record<string, string> = {
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

export function FilterSidebar() {
  const [mounted] = useState(() => typeof window !== "undefined");

  const {
    categories,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    setMinPrice,
    setMaxPrice,
    setMinRating,
    setInStockOnly,
    reset,
    toggleCategory,
  } = useFilters();

  const hasFilters =
    categories.length > 0 ||
    minPrice > 0 ||
    maxPrice < MAX_PRICE ||
    minRating > 0 ||
    inStockOnly;

  if (!mounted) {
    return (
      <aside className="w-72 flex-shrink-0 hidden lg:block">
        <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4 h-96 animate-pulse" />
      </aside>
    );
  }

  return (
    <aside className="w-72 flex-shrink-0 hidden lg:block">
      <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4 filter-sidebar">
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
            Filters
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

        <div className="max-h-80 overflow-y-auto space-y-1 mb-6">
          {CATEGORY_KEYS.map((catKey) => (
            <button
              key={catKey}
              onClick={() => toggleCategory(catKey)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left ${categories.includes(catKey) ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <span className="text-sm">{CATEGORY_NAMES[catKey]}</span>
              {categories.includes(catKey) && (
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
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            Rating
          </h3>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${minRating === rating ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <StarRating rating={rating} size="sm" />
                <span className="text-sm">& up</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <label className="flex items-center gap-3 cursor-pointer no-hover-effect">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium text-gray-900">In Stock Only</span>
          </label>
        </div>
      </div>
    </aside>
  );
}
