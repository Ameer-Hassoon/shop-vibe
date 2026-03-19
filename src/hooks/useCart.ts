'use client';

import { useState, useEffect } from 'react';
import { Product, CartItemType } from '@/types';
import { useCartStore } from '@/store/cart';

export function useCart() {
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const items = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  return {
    isHydrated,
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
  };
}
