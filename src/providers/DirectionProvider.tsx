'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/store/language';

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const language = useLanguage((state) => state.language);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  return <>{children}</>;
}
