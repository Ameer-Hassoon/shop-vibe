"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRequireAuth } from "@/components/account/authRedirect";
import { useFetchJson } from "@/components/account/useFetchJson";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { buttonClass } from "@/components/ui/Button";
import { AlertIcon, StarIcon } from "@/components/account/icons";
import { StarRating } from "@/components/StarRating";
import { ProductThumb } from "@/components/checkout/ProductThumb";
import { formatDate } from "@/lib/format";

interface MyReview {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  isApproved?: boolean;
  createdAt: string;
  product: { id: string; name: string; image: string } | null;
}
interface ReviewsResponse {
  reviews: MyReview[];
  pagination: { page: number; totalPages: number; total: number };
}

const shell = "mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8";

export default function ReviewsPage() {
  const t = useTranslations("reviews");
  const tc = useTranslations("common");
  const locale = useLocale();
  const auth = useRequireAuth("/reviews");
  const [page, setPage] = useState(1);
  const { state, reload } = useFetchJson<ReviewsResponse>(
    auth === "authenticated" ? `/api/users/me/reviews?page=${page}&limit=10` : null,
  );

  const title = <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h1>;

  if (auth !== "authenticated" || state.status === "loading") {
    return (
      <div className={shell} aria-busy="true">
        {title}
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={shell}>
        {title}
        <Card>
          <EmptyState
            icon={<AlertIcon className="h-7 w-7" />}
            title={t("loadError")}
            description={tc("error")}
            action={<Button onClick={reload}>{tc("retry")}</Button>}
          />
        </Card>
      </div>
    );
  }

  const { reviews, pagination } = state.data;

  if (reviews.length === 0 && page === 1) {
    return (
      <div className={shell}>
        {title}
        <Card>
          <EmptyState
            icon={<StarIcon className="h-7 w-7" />}
            title={t("empty")}
            description={t("emptyHint")}
            action={
              <Link href="/" className={buttonClass("primary", "lg")}>
                {t("browse")}
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={shell}>
      {title}
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id}>
            <Card className="flex gap-4 p-4 sm:p-5">
              {r.product && (
                <Link href={`/product/${r.product.id}`} className="shrink-0">
                  <ProductThumb src={r.product.image} alt={r.product.name} className="h-16 w-16 sm:h-20 sm:w-20" sizes="80px" />
                </Link>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {r.product && (
                    <Link href={`/product/${r.product.id}`} className="font-semibold transition-colors hover:text-brand">
                      {r.product.name}
                    </Link>
                  )}
                  {r.isApproved !== undefined && (
                    <Badge tone={r.isApproved ? "success" : "warning"}>
                      {r.isApproved ? t("published") : t("pending")}
                    </Badge>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <StarRating rating={r.rating} size="sm" />
                  <span className="text-xs text-muted">{formatDate(r.createdAt, locale)}</span>
                </div>
                {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                <p className="mt-1 whitespace-pre-line text-sm text-muted">{r.content}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {pagination.totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between" aria-label={t("pagination")}>
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {tc("previous")}
          </Button>
          <span className="tabular text-sm text-muted">
            {page} / {pagination.totalPages}
          </span>
          <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
            {tc("next")}
          </Button>
        </nav>
      )}
    </div>
  );
}
