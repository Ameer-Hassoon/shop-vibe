"use client";

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/navigation";

export default function AdminEditPage() {
  const t = useTranslations();
  const params = useParams();
  const productId = params.id as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {t('common.edit')} {t('common.product')}
      </h1>
      <p className="text-gray-600">{t("common.comingSoon")} #{productId}</p>
      <Link
        href="/admin"
        className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        {t('common.back')}
      </Link>
    </div>
  );
}
