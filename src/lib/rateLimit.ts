import crypto from "crypto";

export type RateLimitRecord = { count: number; timestamp: number };

/**
 * Returns a per-request identifier that can be used for rate limiting.
 *
 * If TRUST_PROXY is enabled, we attempt to use X-Forwarded-For / X-Real-IP.
 * If those headers are missing (or TRUST_PROXY is not enabled), we return a
 * deterministic fallback so all untrusted requests share a stricter bucket.
 */
export function getClientIpFromRequest(request: Request): string {
  const trustProxy = process.env.TRUST_PROXY === "true";

  const getFirst = (value: string | null | undefined) => {
    if (!value) return undefined;
    return value.split(",")[0].trim();
  };

  if (trustProxy) {
    let forwarded: string | undefined;
    let realIp: string | undefined;

    if (typeof request.headers.get === "function") {
      forwarded = getFirst(request.headers.get("x-forwarded-for"));
      realIp = getFirst(request.headers.get("x-real-ip"));
    } else if (request.headers && typeof request.headers === "object") {
      const headers = request.headers as unknown as Record<
        string,
        string | string[] | undefined
      >;
      const forwardedValue = headers["x-forwarded-for"];
      const realIpValue = headers["x-real-ip"];
      if (Array.isArray(forwardedValue)) {
        forwarded = getFirst(forwardedValue[0]);
      } else {
        forwarded = getFirst(forwardedValue);
      }
      if (Array.isArray(realIpValue)) {
        realIp = getFirst(realIpValue[0]);
      } else {
        realIp = getFirst(realIpValue);
      }
    }

    if (forwarded || realIp) {
      return (forwarded || realIp)!;
    }

    console.warn(
      "Rate limit: TRUST_PROXY enabled but no forwarded/real IP headers found. Using shared bucket.",
    );
    return "untrusted-proxy";
  }

  const req = request as Request & { socket?: { remoteAddress?: string } };
  let socketIp = req.socket?.remoteAddress;

  if (socketIp) {
    if (socketIp.startsWith("::ffff:")) {
      socketIp = socketIp.substring(7);
    }
    return socketIp;
  }

  console.warn("Rate limit: No socket address available. Using shared bucket.");
  return "untrusted-proxy";
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
