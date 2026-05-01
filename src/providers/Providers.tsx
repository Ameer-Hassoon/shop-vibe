'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { ThemeProvider } from './ThemeProvider';

export function CartProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}

function WishlistSync({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useWishlistStore.getState().syncWithServer();
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CartProvider>
          <WishlistSync>
            {children}
          </WishlistSync>
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
