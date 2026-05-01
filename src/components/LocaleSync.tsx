"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

/**
 * LocaleSync is a utility component used to synchronize the locale
 * from the URL parameters to the client-side environment (e.g., cookies or state).
 */
export default function LocaleSync() {
  const params = useParams();
  const locale = params?.locale;

  useEffect(() => {
    if (locale && typeof locale === "string") {
      // Example: Sync the locale to a cookie so the server can
      // detect the preference on subsequent requests.
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [locale]);

  // This component does not render any UI
  return null;
}
