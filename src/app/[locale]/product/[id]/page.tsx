import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { localizedUrls, SITE_URL } from "@/lib/site";
import { ProductDetail } from "@/components/ProductDetail";

type Props = { params: Promise<{ locale: string; id: string }> };

// generateMetadata and the page both need the product; cache() makes it one query per request.
const getProduct = cache((id: string) => prisma.product.findUnique({ where: { id } }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const product = await getProduct(id);
  if (!product) return {};

  const description = product.description.slice(0, 160);
  const image = product.image.startsWith("/") ? `${SITE_URL}${product.image}` : product.image;
  const languages = localizedUrls(`/product/${id}`);

  return {
    title: product.name,
    description,
    alternates: { canonical: languages[locale], languages },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: languages[locale],
      images: [{ url: image, alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Unknown ids render the translated not-found page with a real 404 status.
  const product = await getProduct(id);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
