"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClass, Card, EmptyState } from "@/components/ui";
import { ErrorState, PageHeader, Skeleton } from "@/components/admin/AdminUI";
import { IconArrowBack, IconBox } from "@/components/admin/icons";
import { ProductForm } from "@/components/admin/ProductForm";
import { useApi } from "@/components/admin/useApi";
import type { AdminProduct } from "@/components/admin/types";

export default function AdminEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("admin");
  const { data, error, reload } = useApi<AdminProduct>(`/api/products/${encodeURIComponent(id)}`);

  return (
    <>
      <PageHeader
        title={t("editTitle")}
        description={data?.name}
        back={
          <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
            <IconArrowBack className="h-4 w-4" />
            {t("backToProducts")}
          </Link>
        }
      />
      {error?.status === 404 ? (
        <Card>
          <EmptyState
            icon={<IconBox />}
            title={t("productNotFound")}
            description={t("productNotFoundDesc")}
            action={
              <Link href="/admin/products" className={buttonClass("primary", "md")}>
                {t("backToProducts")}
              </Link>
            }
          />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      ) : !data ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-[var(--radius-card)] lg:col-span-2" />
          <Skeleton className="h-80 rounded-[var(--radius-card)]" />
        </div>
      ) : (
        <ProductForm key={data.id} product={data} />
      )}
    </>
  );
}
