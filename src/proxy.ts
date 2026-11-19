import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// /admin, /en/admin, /ar/admin/products ... (a bare /admin falls back to the default locale)
const ADMIN_PATH = new RegExp(`^/(?:(${routing.locales.join("|")})/)?admin(?:/|$)`);

export async function proxy(req: NextRequest) {
  const match = ADMIN_PATH.exec(req.nextUrl.pathname);

  if (match) {
    const locale = match[1] ?? routing.defaultLocale;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const loginUrl = new URL(`/${locale}/login`, req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }
  }

  return handleI18nRouting(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
