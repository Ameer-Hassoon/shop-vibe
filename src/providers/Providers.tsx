'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { useLanguage } from '@/store/language';
import { ThemeProvider } from './ThemeProvider';
import { DirectionProvider } from './DirectionProvider';

function LanguageHydration({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const setHasHydrated = useLanguage((state) => state.setHasHydrated);
  const setLanguage = useLanguage((state) => state.setLanguage);

  useEffect(() => {
    const stored = localStorage.getItem('shop-language');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.state?.language) {
          setLanguage(parsed.state.language);
        }
      } catch {
        // ignore
      }
    }
    setHasHydrated(true);
    setHydrated(true);
  }, [setHasHydrated, setLanguage]);

  if (!hydrated) {
    return null;
  }

  return <>{children}</>;
}

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
        <DirectionProvider>
          <LanguageHydration>
            <CartProvider>
              <WishlistSync>
                {children}
              </WishlistSync>
            </CartProvider>
          </LanguageHydration>
        </DirectionProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
