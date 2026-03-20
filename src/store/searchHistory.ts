"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SearchHistoryState {
  searches: string[];
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearHistory: () => void;
}

export const useSearchHistory = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      searches: [],
      addSearch: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        
        set((state) => {
          const filtered = state.searches.filter(
            (s) => s.toLowerCase() !== trimmed.toLowerCase()
          );
          return {
            searches: [trimmed, ...filtered].slice(0, 5),
          };
        });
      },
      removeSearch: (query) => {
        set((state) => ({
          searches: state.searches.filter(
            (s) => s.toLowerCase() !== query.toLowerCase()
          ),
        }));
      },
      clearHistory: () => {
        set({ searches: [] });
      },
    }),
    { name: "shop-search-history" }
  )
);
