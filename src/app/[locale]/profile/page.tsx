"use client";

import { useTranslations } from 'next-intl';

export default function ProfilePage() {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('profile.myProfile')}</h1>
      <p className="text-gray-600">{t("profile.comingSoon")}</p>
    </div>
  );
}
