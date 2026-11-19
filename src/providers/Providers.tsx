'use client';

import { SessionProvider, useSession } from 'next-auth/react';
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

/** Merges the local wishlist with the server one once the user is signed in. Guests keep a local-only list. */
function WishlistSync({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      useWishlistStore.getState().syncWithServer();
    } else if (status === 'unauthenticated') {
      useWishlistStore.setState({ isHydrated: true });
    }
  }, [status]);

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
