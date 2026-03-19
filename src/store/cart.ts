import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartState, CartItemType } from '@/types';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product: Product) => {
        const items = get().items;
        const existingItem = items.find(item => item.productId === product.id);

        if (existingItem) {
          set({
            items: items.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          const newItem: CartItemType = {
            id: crypto.randomUUID(),
            productId: product.id,
            product,
            quantity: 1,
          };
          set({ items: [...items, newItem] });
        }
      },

      removeFromCart: (productId: string) => {
        set({
          items: get().items.filter(item => item.productId !== productId),
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set({
          items: get().items.map(item =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'cart-storage',
      skipHydration: true,
    }
  )
);
