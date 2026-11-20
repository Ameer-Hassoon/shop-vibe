import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Account, checkout and back-office pages are private or empty for crawlers.
      disallow: [
        "/api/",
        "/*/admin",
        "/*/cart",
        "/*/checkout",
        "/*/orders",
        "/*/profile",
        "/*/wishlist",
        "/*/reviews",
        "/*/login",
        "/*/register",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
