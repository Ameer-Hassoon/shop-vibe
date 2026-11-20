import { routing } from "@/i18n/routing";

/** Public origin of the site, used for absolute URLs (sitemap, robots, Open Graph). */
export const SITE_URL = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Absolute URL of `path` in every locale, for hreflang alternates. */
export function localizedUrls(path: string) {
  return Object.fromEntries(routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`]));
}
