"use client";

import { useCallback, useEffect, useState } from "react";

export interface ApiError {
  status: number;
  message?: string;
}

interface Result<T> {
  key: string;
  data?: T;
  error?: ApiError;
}

/**
 * Small fetch hook. While a new URL loads, the previous data is kept (`loading` is true)
 * so paginated tables don't flash empty. `error` only reflects the current URL.
 */
export function useApi<T>(url: string | null) {
  const [tick, setTick] = useState(0);
  const [res, setRes] = useState<Result<T> | null>(null);
  const key = url ? `${url}#${tick}` : null;

  useEffect(() => {
    if (!url || key === null) return;
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal, cache: "no-store" })
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        if (!r.ok) setRes({ key, error: { status: r.status, message: json?.error } });
        else setRes({ key, data: json as T });
      })
      .catch((e: unknown) => {
        if ((e as Error)?.name !== "AbortError") setRes({ key, error: { status: 0 } });
      });
    return () => ctrl.abort();
  }, [url, key]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  const current = key !== null && res?.key === key;
  return {
    data: res?.data,
    error: current ? res?.error : undefined,
    loading: key !== null && !current,
    reload,
  };
}
