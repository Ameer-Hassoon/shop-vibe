"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClass, EmptyState } from "@/components/ui";
import { SearchIcon } from "@/components/icons";

export default function NotFound() {
  const t = useTranslations("common");
  const locale = useLocale();
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <EmptyState
        icon={<SearchIcon className="h-6 w-6" />}
        title={t("notFoundTitle")}
        description={t("notFoundBody")}
        action={
          <Link href="/" locale={locale} className={buttonClass("primary", "md")}>
            {t("backToShop")}
          </Link>
        }
      />
    </div>
  );
}
