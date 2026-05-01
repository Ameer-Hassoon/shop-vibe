"use client";

import { useTranslations } from 'next-intl';

export default function ReviewsPage() {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('product.reviews')}</h1>
      <p className="text-gray-600">{t("reviews.comingSoon")}</p>
    </div>
  );
}
