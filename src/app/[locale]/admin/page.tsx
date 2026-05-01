"use client";


import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function AdminPage() {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('common.admin')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/create"
          className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold mb-2">{t('common.add')} Product</h2>
          <p className="text-gray-600">Create a new product</p>
        </Link>
        <Link
          href="/admin/orders"
          className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold mb-2">{t('common.orders')}</h2>
          <p className="text-gray-600">Manage orders</p>
        </Link>
      </div>
    </div>
  );
}
