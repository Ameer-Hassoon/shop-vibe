"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  items: string[];
  isHydrated: boolean;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggleItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  fetchWishlist: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,
      syncWithServer: async () => {
        try {
          const res = await fetch("/api/wishlist");
          if (res.status === 401) {
            set({ isHydrated: true });
            return;
          }
          if (!res.ok) {
            const text = await res.text();
            console.error(`Failed to sync wishlist: ${res.status} ${text}`);
            set({ isHydrated: true });
            return;
          }
          const data = await res.json();
          const serverItems = data.map((item: { productId: string }) => item.productId);
          const localItems = get().items;
          const mergedItems = Array.from(new Set([...serverItems, ...localItems]));
          set({ items: mergedItems, isHydrated: true });
        } catch (error) {
          console.error("Failed to sync wishlist:", error);
          set({ isHydrated: true });
        }
      },
      addItem: async (productId) => {
        if (get().items.includes(productId)) {
          return;
        }
        const previousItems = get().items;
        set((state) => ({
          items: [...state.items, productId],
        }));
        try {
          const res = await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
          if (!res.ok) {
            if (res.status === 409) {
              return;
            }
            const text = await res.text();
            throw new Error(`Wishlist add failed: ${res.status} ${text}`);
          }
        } catch (error) {
          console.error("Failed to add to wishlist:", error);
          set({ items: previousItems });
        }
      },
      removeItem: async (productId) => {
        if (!get().items.includes(productId)) {
          return;
        }
        const previousItems = get().items;
        set((state) => ({
          items: state.items.filter((id) => id !== productId),
        }));
        try {
          const res = await fetch("/api/wishlist", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
          if (!res.ok) {
            if (res.status === 404) {
              return;
            }
            const text = await res.text();
            throw new Error(`Wishlist remove failed: ${res.status} ${text}`);
          }
        } catch (error) {
          console.error("Failed to remove from wishlist:", error);
          set({ items: previousItems });
        }
      },
      toggleItem: async (productId) => {
        const isInWishlist = get().items.includes(productId);
        if (isInWishlist) {
          await get().removeItem(productId);
        } else {
          await get().addItem(productId);
        }
      },
      isInWishlist: (productId) => get().items.includes(productId),
      fetchWishlist: async () => {
        try {
          const res = await fetch("/api/wishlist");
          if (!res.ok) {
            const text = await res.text();
            console.error(`Failed to fetch wishlist: ${res.status} ${text}`);
            return;
          }
          const data = await res.json();
          set({
            items: data.map((item: { productId: string }) => item.productId),
          });
        } catch (error) {
          console.error("Failed to fetch wishlist:", error);
        }
      },
    }),
    { name: "shop-wishlist" }
  ),
);
