import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartState, CartItemType } from '@/types';

/** Hard cap per line, regardless of stock. */
export const MAX_LINE_QUANTITY = 99;

/** Largest quantity allowed for a product: bounded by stock (when known) and MAX_LINE_QUANTITY. */
export function maxQuantityFor(product: Pick<Product, 'stock'>): number {
  const stock = Number.isFinite(product.stock) ? Math.floor(product.stock) : MAX_LINE_QUANTITY;
  return Math.max(1, Math.min(MAX_LINE_QUANTITY, stock));
}

/** Integer >= 1 and <= max. Anything non-numeric becomes 1. */
export function clampQuantity(quantity: unknown, max: number = MAX_LINE_QUANTITY): number {
  const n = typeof quantity === 'number' ? Math.floor(quantity) : Math.floor(Number(quantity));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, Math.max(1, max));
}

function isValidItem(item: unknown): item is CartItemType {
  if (!item || typeof item !== 'object') return false;
  const i = item as Partial<CartItemType>;
  return (
    typeof i.productId === 'string' &&
    !!i.product &&
    typeof i.product.id === 'string' &&
    typeof i.product.price === 'number' &&
    Number.isFinite(i.product.price)
  );
}

/** Drop corrupt entries, merge duplicates and clamp quantities of persisted data. */
function sanitizeItems(raw: unknown): CartItemType[] {
  if (!Array.isArray(raw)) return [];
  const byProduct = new Map<string, CartItemType>();
  for (const item of raw) {
    if (!isValidItem(item)) continue;
    const existing = byProduct.get(item.productId);
    const quantity = (existing?.quantity ?? 0) + clampQuantity(item.quantity);
    byProduct.set(item.productId, {
      ...item,
      id: existing?.id ?? item.id ?? crypto.randomUUID(),
      quantity: clampQuantity(quantity, maxQuantityFor(item.product)),
    });
  }
  return [...byProduct.values()];
}

interface CartExtras {
  /** Refresh stored product snapshots (price/stock/name/image) from fresh server data. */
  syncProducts: (products: Product[]) => void;
}

export const useCartStore = create<CartState & CartExtras>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product: Product) => {
        const items = get().items;
        const existingItem = items.find(item => item.productId === product.id);
        const max = maxQuantityFor(product);

        if (existingItem) {
          set({
            items: items.map(item =>
              item.productId === product.id
                ? { ...item, product, quantity: clampQuantity(item.quantity + 1, max) }
                : item
            ),
          });
        } else {
          if (product.stock <= 0) return;
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
        if (!Number.isFinite(quantity) || quantity < 1) {
          get().removeFromCart(productId);
          return;
        }
        set({
          items: get().items.map(item =>
            item.productId === productId
              ? { ...item, quantity: clampQuantity(quantity, maxQuantityFor(item.product)) }
              : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      syncProducts: (products: Product[]) => {
        const byId = new Map(products.map(p => [p.id, p]));
        set({
          items: get().items.map(item => {
            const fresh = byId.get(item.productId);
            if (!fresh) return item;
            return {
              ...item,
              product: fresh,
              quantity: clampQuantity(item.quantity, maxQuantityFor(fresh)),
            };
          }),
        });
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
      version: 1,
      // Carts saved before versioning (v0) have the same shape; `merge` below sanitizes any
      // version's items, so pass them through instead of discarding the visitor's cart.
      migrate: (persisted) => persisted as { items: CartItemType[] },
      // Hydrated manually from an effect (see Providers) so the server and first client render match.
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        items: sanitizeItems((persisted as { items?: unknown } | undefined)?.items),
      }),
    }
  )
);

const selectTotalItems = (state: CartState) => 
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export { selectTotalItems };
