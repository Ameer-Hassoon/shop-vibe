"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_PRICE = 1000;

// Categories are stored by their catalogue name (what /api/products?category= expects).
// Older versions stored `cat.x` keys; migrate those back to names.
const LEGACY_KEY_TO_NAME: Record<string, string> = {
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
  "cat.sports": "Sports",
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

function migrateCategories(cats: unknown): string[] {
  if (!Array.isArray(cats)) return [];
  return cats
    .filter((c): c is string => typeof c === "string")
    .map((c) => LEGACY_KEY_TO_NAME[c] ?? c);
}

interface FilterState {
  categories: string[];
  minPrice: number;
  maxPrice: number;
  minRating: number;
  inStockOnly: boolean;
  sortBy: string;
  currentPage: number;
  setCategories: (cats: string[]) => void;
  toggleCategory: (cat: string) => void;
  setMinPrice: (val: number) => void;
  setMaxPrice: (val: number) => void;
  setMinRating: (val: number) => void;
  setInStockOnly: (val: boolean) => void;
  setSortBy: (val: string) => void;
  setCurrentPage: (val: number) => void;
  reset: () => void;
}

export const useFilters = create<FilterState>()(
  persist(
    (set) => ({
      categories: [],
      minPrice: 0,
      maxPrice: MAX_PRICE,
      minRating: 0,
      inStockOnly: false,
      sortBy: "newest",
      currentPage: 1,
      setCategories: (categories) => set({ categories, currentPage: 1 }),
      toggleCategory: (cat) =>
        set((state) => ({
          categories: state.categories.includes(cat)
            ? state.categories.filter((c) => c !== cat)
            : [...state.categories, cat],
          currentPage: 1,
        })),
      setMinPrice: (minPrice) => set({ minPrice, currentPage: 1 }),
      setMaxPrice: (maxPrice) => set({ maxPrice, currentPage: 1 }),
      setMinRating: (minRating) => set({ minRating, currentPage: 1 }),
      setInStockOnly: (inStockOnly) => set({ inStockOnly, currentPage: 1 }),
      setSortBy: (sortBy) => set({ sortBy, currentPage: 1 }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      reset: () =>
        set({
          categories: [],
          minPrice: 0,
          maxPrice: 1000,
          minRating: 0,
          inStockOnly: false,
          sortBy: "newest",
          currentPage: 1,
        }),
    }),
    {
      name: "shop-filters",
      version: 1,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<FilterState>;
        return { ...state, categories: migrateCategories(state.categories), currentPage: 1 } as FilterState;
      },
    },
  ),
);
