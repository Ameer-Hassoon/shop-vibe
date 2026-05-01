"use client";


import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('auth.createAccount')}</h1>
      <p className="text-gray-600">Registration form coming soon...</p>
    </div>
  );
}
