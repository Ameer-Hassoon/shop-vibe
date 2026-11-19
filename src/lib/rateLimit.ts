export type RateLimitRecord = { count: number; timestamp: number };

const SHARED_BUCKET = "untrusted-proxy";
const MAX_KEY_LENGTH = 64;
let warnedNoIp = false;

function warnOnce(message: string) {
  if (warnedNoIp) return;
  warnedNoIp = true;
  console.warn(message);
}

function readHeader(request: Request, name: string): string | undefined {
  const headers = request.headers as unknown;
  if (headers && typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name) ?? undefined;
  }
  // NextAuth hands `authorize()` a plain object, not a Request.
  if (headers && typeof headers === "object") {
    const value = (headers as Record<string, string | string[] | undefined>)[name];
    return Array.isArray(value) ? value[0] : value;
  }
  return undefined;
}

/**
 * Returns a per-request identifier that can be used for rate limiting.
 *
 * Only when TRUST_PROXY=true (the app sits behind exactly one reverse proxy that appends to
 * X-Forwarded-For) do we read the client IP from headers. We take the LAST entry of
 * X-Forwarded-For, which is the one our proxy added; earlier entries are client-controlled
 * and trivially spoofable. Otherwise (or if no header is present) all requests share one
 * bucket, because Next.js route handlers expose no socket address.
 */
export function getClientIpFromRequest(request: Request): string {
  const trustProxy = ["true", "1"].includes(
    (process.env.TRUST_PROXY ?? "").toLowerCase(),
  );

  if (trustProxy) {
    const forwarded = readHeader(request, "x-forwarded-for")
      ?.split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .pop();
    const realIp = readHeader(request, "x-real-ip")?.trim();
    const ip = forwarded || realIp;
    if (ip) return ip.slice(0, MAX_KEY_LENGTH);

    warnOnce(
      "Rate limit: TRUST_PROXY enabled but no forwarded/real IP headers found. Using shared bucket.",
    );
    return SHARED_BUCKET;
  }

  warnOnce(
    "Rate limit: TRUST_PROXY is not enabled; all clients share one rate-limit bucket.",
  );
  return SHARED_BUCKET;
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

    /** Clears the counter, e.g. after a successful login. */
    reset(ip: string) {
      map.delete(ip);
    },

    /**
     * Returns the raw map (for testing/debugging).
     */
    _map: map,
  };
}
