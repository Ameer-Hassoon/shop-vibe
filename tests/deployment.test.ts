import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rateLimit";
import { isReadOnlyAccount } from "@/lib/auth";
import { hideCustomerDetails } from "@/lib/orders";

afterAll(async () => {
  await prisma.rateLimit.deleteMany();
  await prisma.$disconnect();
});

describe("database rate limiter", () => {
  const limiter = createRateLimiter({ name: "test", windowMs: 60_000, maxAttempts: 3 });

  beforeEach(async () => {
    await prisma.rateLimit.deleteMany();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("limits after maxAttempts and stores only hashed keys", async () => {
    for (let i = 1; i <= 3; i++) {
      expect(await limiter.isRateLimited("1.2.3.4|a@b.com")).toBe(false);
      expect(await limiter.increment("1.2.3.4|a@b.com")).toBe(i);
    }
    expect(await limiter.isRateLimited("1.2.3.4|a@b.com")).toBe(true);
    expect(await limiter.isRateLimited("1.2.3.4|other@b.com")).toBe(false);

    const rows = await prisma.rateLimit.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toMatch(/^[0-9a-f]{64}$/);
  });

  it("counts every concurrent hit exactly once", async () => {
    const counts = await Promise.all(Array.from({ length: 10 }, () => limiter.increment("burst")));
    expect(counts.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("starts a new window once the old one has expired", async () => {
    for (let i = 0; i < 3; i++) await limiter.increment("k");
    expect(await limiter.isRateLimited("k")).toBe(true);

    vi.useFakeTimers({ now: Date.now() + 61_000, toFake: ["Date"] });
    expect(await limiter.isRateLimited("k")).toBe(false);
    expect(await limiter.increment("k")).toBe(1);
  });

  it("reset clears the counter and names keep limiters apart", async () => {
    const other = createRateLimiter({ name: "other", windowMs: 60_000, maxAttempts: 3 });
    for (let i = 0; i < 3; i++) await limiter.increment("k");
    expect(await other.isRateLimited("k")).toBe(false);

    await limiter.reset("k");
    expect(await limiter.isRateLimited("k")).toBe(false);
  });
});

describe("read-only demo admin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("matches only DEMO_ADMIN_EMAIL, case-insensitively", () => {
    vi.stubEnv("DEMO_ADMIN_EMAIL", "Demo-Admin@Shop.com");
    expect(isReadOnlyAccount("demo-admin@shop.com")).toBe(true);
    expect(isReadOnlyAccount("admin@shop.com")).toBe(false);
    expect(isReadOnlyAccount(null)).toBe(false);
  });

  it("is disabled when DEMO_ADMIN_EMAIL is empty", () => {
    vi.stubEnv("DEMO_ADMIN_EMAIL", "");
    expect(isReadOnlyAccount("")).toBe(false);
    expect(isReadOnlyAccount("admin@shop.com")).toBe(false);
  });

  it("masks customer details but keeps order data", () => {
    const order = {
      id: "o1",
      total: 99,
      city: "Cairo",
      phone: "+20 100 123 4567",
      shippingAddress: "1 Main St",
      zipCode: "11511",
      trackingNumber: null,
      user: { id: "u1", name: "Sara", email: "sara@example.com" },
    };
    const masked = hideCustomerDetails(order);

    expect(masked).toMatchObject({ id: "o1", total: 99, city: "Cairo", trackingNumber: null });
    expect(JSON.stringify(masked)).not.toMatch(/Sara|sara@|example\.com|123 4567|Main St|11511/);
    expect(masked.user.id).toBe("u1");
    expect(order.user.email).toBe("sara@example.com"); // the input is not mutated
  });
});
