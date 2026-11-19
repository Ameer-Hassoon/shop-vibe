"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";

/**
 * Normalises a callbackUrl into a locale-less in-app path (the next-intl router adds the locale).
 * Rejects absolute / protocol-relative URLs to avoid open redirects.
 */
export function safeCallback(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  let path = raw;
  try {
    // Accept same-origin absolute URLs (NextAuth style) but nothing else.
    if (/^https?:\/\//i.test(path)) {
      const u = new URL(path);
      if (typeof window === "undefined" || u.origin !== window.location.origin) return fallback;
      path = u.pathname + u.search;
    }
  } catch {
    return fallback;
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  path = path.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  return path;
}

/** Redirects to the login page (keeping a way back) when there is no session. Returns the session status. */
export function useRequireAuth(returnTo: string) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
    }
  }, [status, router, returnTo]);

  return status;
}
