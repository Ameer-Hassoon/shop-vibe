import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";
import { localizedUrls } from "@/lib/site";

// Rebuilt at most hourly so new products show up without a redeploy.
export const revalidate = 3600;

function entry(path: string, lastModified?: Date): MetadataRoute.Sitemap {
  const urls = localizedUrls(path);
  return routing.locales.map((locale) => ({
    url: urls[locale],
    lastModified,
    alternates: { languages: urls },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { id: string; updatedAt: Date }[] = [];
  try {
    products = await prisma.product.findMany({ select: { id: true, updatedAt: true } });
  } catch (err) {
    // A database outage should not take the whole sitemap down; list the home page only.
    console.error("Sitemap: failed to load products:", err);
  }

  return [...entry(""), ...products.flatMap((p) => entry(`/product/${p.id}`, p.updatedAt))];
}
