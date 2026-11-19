import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

/**
 * A fixed-window rate limiter whose counters live in the database, so the limit holds across
 * serverless instances (an in-memory Map would give every instance its own count).
 * Keys are hashed before storage; pass a distinct `name` per limiter so their keys never collide.
 */
export function createRateLimiter({
  name,
  windowMs,
  maxAttempts,
}: {
  name: string;
  windowMs: number;
  maxAttempts: number;
}) {
  const storageKey = (key: string) =>
    createHash("sha256").update(`${name}:${key}`).digest("hex");
  const windowStartCutoff = () => new Date(Date.now() - windowMs);

  return {
    /** True when `key` has used up its attempts in the current window. Does not count a hit. */
    async isRateLimited(key: string) {
      const record = await prisma.rateLimit.findUnique({ where: { key: storageKey(key) } });
      return !!record && record.windowStart > windowStartCutoff() && record.count >= maxAttempts;
    },

    /** Counts one attempt for `key` and returns the new count. Atomic under concurrency. */
    async increment(key: string) {
      // Prisma stores DateTime as UTC in a `timestamp` column. Raw Date parameters would be
      // shifted by the database session's time zone, so pass UTC timestamps explicitly.
      const now = Prisma.sql`CAST(${new Date().toISOString()} AS timestamptz) AT TIME ZONE 'UTC'`;
      const cutoff = Prisma.sql`CAST(${windowStartCutoff().toISOString()} AS timestamptz) AT TIME ZONE 'UTC'`;
      const rows = await prisma.$queryRaw<{ count: number }[]>`
        INSERT INTO "RateLimit" ("key", "count", "windowStart")
        VALUES (${storageKey(key)}, 1, ${now})
        ON CONFLICT ("key") DO UPDATE SET
          "count" = CASE WHEN "RateLimit"."windowStart" <= ${cutoff}
                         THEN 1 ELSE "RateLimit"."count" + 1 END,
          "windowStart" = CASE WHEN "RateLimit"."windowStart" <= ${cutoff}
                               THEN ${now} ELSE "RateLimit"."windowStart" END
        RETURNING "count"`;
      // Expired rows are only clutter; sweep them now and then instead of on every request.
      if (Math.random() < 0.02) {
        await prisma.rateLimit
          .deleteMany({ where: { windowStart: { lte: windowStartCutoff() } } })
          .catch((err) => console.error("Rate limit cleanup failed:", err));
      }
      return Number(rows[0]?.count ?? 1);
    },

    /** Clears the counter, e.g. after a successful login. */
    async reset(key: string) {
      await prisma.rateLimit.deleteMany({ where: { key: storageKey(key) } });
    },
  };
}
