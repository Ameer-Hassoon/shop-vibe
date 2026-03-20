"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_PRICE = 1000;

const CATEGORY_NAME_TO_KEY: Record<string, string> = {
  "Electronics": "cat.electronics",
  "Computers & Laptops": "cat.computers",
  "Phones & Tablets": "cat.phones",
  "Cameras & Photography": "cat.cameras",
  "TV & Home Entertainment": "cat.tv",
  "Audio & Headphones": "cat.audio",
  "Clothing": "cat.clothing",
  "Shoes & Footwear": "cat.shoes",
  "Jewelry & Watches": "cat.jewelry",
  "Bags & Backpacks": "cat.bags",
  "Home & Garden": "cat.home",
  "Kitchen & Dining": "cat.kitchen",
  "Furniture": "cat.furniture",
  "Lighting": "cat.lighting",
  "Sports & Outdoors": "cat.sports",
  "Fitness Equipment": "cat.fitness",
  "Cycling": "cat.cycling",
  "Camping & Hiking": "cat.camping",
  "Books": "cat.books",
  "Toys & Games": "cat.toys",
  "Beauty & Personal Care": "cat.beauty",
  "Automotive": "cat.automotive",
  "Pet Supplies": "cat.pets",
  "Office Supplies": "cat.office",
  // Arabic names (legacy)
  "إلكترونيات": "cat.electronics",
  "أجهزة الكمبيوتر المحمولة": "cat.computers",
  "الهواتف والأجهزة اللوحية": "cat.phones",
  "الكاميرات والتصوير": "cat.cameras",
  "التلفاز والترفيه المنزلي": "cat.tv",
  "الصوتيات والسماعات": "cat.audio",
  "الملابس": "cat.clothing",
  "الأحذية": "cat.shoes",
  "المجوهرات والساعات": "cat.jewelry",
  "الحقائب والحزم": "cat.bags",
  "المنزل والحديقة": "cat.home",
  "المطبخ وتناول الطعام": "cat.kitchen",
  "الأثاث": "cat.furniture",
  "الإضاءة": "cat.lighting",
  "الرياضة في الهواء الطلق": "cat.sports",
  "معدات اللياقة البدنية": "cat.fitness",
  "ركوب الدراجات": "cat.cycling",
  "التخييم والمشي": "cat.camping",
  "الكتب": "cat.books",
  "الألعاب": "cat.toys",
  "الجمال والعناية الشخصية": "cat.beauty",
  "السيارات": "cat.automotive",
  "مستلزمات الحيوانات الأليفة": "cat.pets",
  "لوازم المكتب": "cat.office",
};

function migrateCategories(cats: string[]): string[] {
  return cats.map(cat => CATEGORY_NAME_TO_KEY[cat] || cat).filter(cat => cat.startsWith("cat."));
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
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.categories) && state.categories.length > 0) {
          const migrated = migrateCategories(state.categories);
          if (migrated.length > 0) {
            state.categories = migrated;
            state.currentPage = 1;
          }
        }
      },
    },
  ),
);
