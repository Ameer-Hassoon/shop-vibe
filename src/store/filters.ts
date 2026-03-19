"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      maxPrice: 1000,
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
    { name: "shop-filters" },
  ),
);
