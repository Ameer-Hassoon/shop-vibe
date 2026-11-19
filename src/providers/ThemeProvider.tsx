"use client";

import { useEffect } from "react";
import { useTheme } from "@/store/theme";

/**
 * Keeps <html class="dark"> in sync with the theme store. The inline script in the locale layout
 * sets the initial class before paint and the store reads it, so this only runs on later changes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return <>{children}</>;
}
