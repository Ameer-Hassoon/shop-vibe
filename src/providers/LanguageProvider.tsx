"use client";

import { useEffect } from "react";
import { useLanguage } from "@/store/language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  return <>{children}</>;
}
