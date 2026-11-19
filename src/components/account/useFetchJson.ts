"use client";

import { useCallback, useEffect, useState } from "react";

export type FetchState<T> =
  | { status: "loading" }
  | { status: "error"; httpStatus?: number }
  | { status: "ok"; data: T };

/** GET a JSON endpoint with loading / error states and a reload function. Pass null to skip. */
export function useFetchJson<T>(url: string | null) {
  const [nonce, setNonce] = useState(0);
  const key = url ? `${url}#${nonce}` : null;
  const [result, setResult] = useState<{ key: string; state: FetchState<T> } | null>(null);

  useEffect(() => {
    if (!url || !key) return;
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) {
          setResult({ key, state: { status: "error", httpStatus: res.status } });
          return;
        }
        setResult({ key, state: { status: "ok", data: (await res.json()) as T } });
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setResult({ key, state: { status: "error" } });
      });
    return () => ctrl.abort();
  }, [url, key]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  // A result belonging to an older url/nonce counts as loading.
  const state: FetchState<T> = result && result.key === key ? result.state : { status: "loading" };
  return { state, reload };
}
