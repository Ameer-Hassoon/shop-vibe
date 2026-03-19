'use client';

import { useSyncExternalStore } from 'react';
import { useCartStore } from '@/store/cart';

export function useCart() {
  const subscribe = useCartStore.subscribe;
  const getSnapshot = () => useCartStore.getState();

  const items = useSyncExternalStore(subscribe, getSnapshot).items;
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
  };
}
