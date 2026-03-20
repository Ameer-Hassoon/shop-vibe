"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  items: string[];
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggleItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  fetchWishlist: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: async (productId) => {
        const previousItems = get().items;
        set((state) => ({
          items: state.items.includes(productId)
            ? state.items
            : [...state.items, productId],
        }));
        try {
          const res = await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Wishlist add failed: ${res.status} ${text}`);
          }
        } catch (error) {
          console.error("Failed to add to wishlist:", error);
          set({ items: previousItems });
        }
      },
      removeItem: async (productId) => {
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
    { name: "shop-wishlist" },
  ),
);
