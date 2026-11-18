"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// The inline script in [locale]/layout.tsx has already applied the saved or OS theme to <html>,
// so start from whatever is on the page to avoid flipping it back on hydration.
const initialTheme = (): Theme =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: initialTheme(),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "shop-theme" },
  ),
);
