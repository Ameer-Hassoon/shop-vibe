"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useCartStore } from "@/store/cart";

/**
 * True once the persisted cart has been loaded from localStorage on the client.
 * The store uses skipHydration, so the first render matches the server (empty cart);
 * pages that depend on the cart contents should show a skeleton until this is true.
 */
export function useCartHydrated(): boolean {
  const hydrated = useSyncExternalStore(
    (onChange) => useCartStore.persist.onFinishHydration(onChange),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    // Providers also rehydrates; this is a safe fallback and a no-op once hydrated.
    if (!useCartStore.persist.hasHydrated()) void useCartStore.persist.rehydrate();
  }, []);

  return hydrated;
}

export function useCart() {
  const items = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
}
