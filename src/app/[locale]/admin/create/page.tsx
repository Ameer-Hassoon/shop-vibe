"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/admin/AdminUI";
import { IconArrowBack } from "@/components/admin/icons";
import { ProductForm } from "@/components/admin/ProductForm";

export default function AdminCreatePage() {
  const t = useTranslations("admin");
  return (
    <>
      <PageHeader
        title={t("createTitle")}
        description={t("createSubtitle")}
        back={
          <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
            <IconArrowBack className="h-4 w-4" />
            {t("backToProducts")}
          </Link>
        }
      />
      <ProductForm />
    </>
  );
}
