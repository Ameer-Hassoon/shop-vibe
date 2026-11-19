import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ProductDetail } from "@/components/ProductDetail";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true, description: true } });
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Unknown ids render the translated not-found page with a real 404 status.
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
