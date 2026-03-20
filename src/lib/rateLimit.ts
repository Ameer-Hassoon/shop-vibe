import crypto from "crypto";

export type RateLimitRecord = { count: number; timestamp: number };

/**
 * Returns a per-request identifier that can be used for rate limiting.
 *
 * If TRUST_PROXY is enabled, we attempt to use X-Forwarded-For / X-Real-IP.
 * If those headers are missing (or TRUST_PROXY is not enabled), we return a
 * unique value per request so that clients without these headers do not share
 * a common rate-limit bucket.
 */
export function getClientIpFromRequest(request: Request): string {
  const trustProxy = process.env.TRUST_PROXY === "true";

  const getFirst = (value: string | null) => {
    if (!value) return undefined;
    return value.split(",")[0].trim();
  };

  if (trustProxy) {
    const forwarded = getFirst(request.headers.get("x-forwarded-for"));
    const realIp = getFirst(request.headers.get("x-real-ip"));
    return forwarded || realIp || crypto.randomUUID();
  }

  // When not trusting proxy headers, give each request a unique token to avoid
  // pooling clients into a shared "unknown" bucket.
  return crypto.randomUUID();
}

export function createInMemoryRateLimiter({
  windowMs,
  maxAttempts,
}: {
  windowMs: number;
  maxAttempts: number;
}) {
  const map = new Map<string, RateLimitRecord>();

  const purgeStale = () => {
    const now = Date.now();
    for (const [key, record] of map.entries()) {
      if (now - record.timestamp > windowMs) {
        map.delete(key);
      }
    }
  };

  return {
    /**
     * Returns true if the given identifier has exceeded the limit.
     * This function does not mutate state.
     */
    isRateLimited(ip: string) {
      purgeStale();
      const record = map.get(ip);
      return !!record && record.count >= maxAttempts;
    },

    /**
     * Increments the counter for the given identifier.
     * Returns the new count.
     */
    increment(ip: string) {
      purgeStale();
      const now = Date.now();
      const record = map.get(ip);
      if (!record) {
        map.set(ip, { count: 1, timestamp: now });
        return 1;
      }

      // If the record is stale, reset it.
      if (now - record.timestamp > windowMs) {
        map.set(ip, { count: 1, timestamp: now });
        return 1;
      }

      record.count += 1;
      return record.count;
    },

    /**
     * Returns the raw map (for testing/debugging).
     */
    _map: map,
  };
}
