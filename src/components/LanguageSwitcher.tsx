"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { GlobeIcon } from "./icons";

/** One-tap language toggle: shows the language you would switch to, in its own script. */
export default function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("navbar");
  const router = useRouter();
  const pathname = usePathname();

  const target = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;
  const label = target === "ar" ? "العربية" : "English";

  const switchLocale = () => {
    // Keep the query string (search, etc.) when changing language.
    const query = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`${pathname}${query}`, { locale: target });
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      lang={target}
      aria-label={t("switchLanguage", { language: label })}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-control)] px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-2",
        className,
      )}
    >
      <GlobeIcon className="h-[18px] w-[18px] text-muted" />
      <span>{label}</span>
    </button>
  );
}
