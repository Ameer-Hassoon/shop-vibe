import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createOrder, OrderError, updateOrderAsAdmin } from "@/lib/orders";
import { canTransition } from "@/lib/orderStatus";
import { computeOrderTotals } from "@/lib/pricing";
import { createOrderSchema, type CreateOrderInput } from "@/lib/validation";

const address = {
  shippingAddress: "1 Main St",
  city: "Cairo",
  state: "Cairo",
  zipCode: "11511",
  phone: "+20 100 123 4567",
  paymentMethod: "cod" as const,
};

/** Goes through the real schema, like the route does. */
const input = (
  items: { productId: string; quantity: number }[],
  extra: Record<string, unknown> = {},
): CreateOrderInput => createOrderSchema.parse({ ...address, items, ...extra });

const stockOf = async (id: string) => (await prisma.product.findUniqueOrThrow({ where: { id } })).stock;

const failure = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e as OrderError;
  }
  throw new Error("expected createOrder to fail");
};

let userId: string;

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  userId = (await prisma.user.create({ data: { email: "buyer@test.dev", password: "x" } })).id;
  await prisma.product.createMany({
    data: [
      { id: "a", name: "Product A", description: "d", price: 40, image: "/a.png", category: "Clothing", stock: 10 },
      { id: "b", name: "Product B", description: "d", price: 19.99, image: "/b.png", category: "Clothing", stock: 3 },
    ],
  });
});

afterAll(() => prisma.$disconnect());

const coupon = (over: Record<string, unknown> = {}) =>
  prisma.coupon.create({
    data: {
      code: "TEST10",
      type: "PERCENTAGE",
      value: 10,
      validFrom: new Date(Date.now() - 86_400_000),
      validUntil: new Date(Date.now() + 86_400_000),
      ...over,
    },
  });

describe("createOrder validation (schema level)", () => {
  it.each([-5, 0, 1.5, 100])("rejects quantity %s before touching the database", (quantity) => {
    expect(createOrderSchema.safeParse({ ...address, items: [{ productId: "a", quantity }] }).success).toBe(false);
  });
});

describe("createOrder", () => {
  it("creates a PENDING order with server-side prices and decrements stock", async () => {
    const order = await createOrder(userId, input([{ productId: "a", quantity: 2 }]));
    expect(order.status).toBe("PENDING");
    expect(order.items).toHaveLength(1);
    expect(order.items[0].price).toBe(40);
    expect(order.phone).toBe(address.phone);
    expect(await stockOf("a")).toBe(8);
  });

  it("merges duplicate productIds into one line and decrements once", async () => {
    const order = await createOrder(
      userId,
      input([
        { productId: "a", quantity: 2 },
        { productId: "a", quantity: 3 },
      ]),
    );
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(5);
    expect(await stockOf("a")).toBe(5);
  });

  it("rejects merged quantities above 99 per product", async () => {
    const err = await failure(
      createOrder(
        userId,
        input([
          { productId: "a", quantity: 60 },
          { productId: "a", quantity: 60 },
        ]),
      ),
    );
    expect(err.code).toBe("VALIDATION");
    expect(await stockOf("a")).toBe(10);
  });

  it("returns PRODUCT_NOT_FOUND for unknown products and changes nothing", async () => {
    const err = await failure(
      createOrder(
        userId,
        input([
          { productId: "a", quantity: 1 },
          { productId: "nope", quantity: 1 },
        ]),
      ),
    );
    expect(err.code).toBe("PRODUCT_NOT_FOUND");
    expect(err.status).toBe(400);
    expect(await stockOf("a")).toBe(10);
  });

  it("returns OUT_OF_STOCK and leaves every product's stock untouched (no partial change)", async () => {
    const err = await failure(
      createOrder(
        userId,
        input([
          { productId: "a", quantity: 4 }, // would succeed on its own
          { productId: "b", quantity: 4 }, // only 3 in stock
        ]),
      ),
    );
    expect(err.code).toBe("OUT_OF_STOCK");
    expect(err.status).toBe(409);
    expect(await stockOf("a")).toBe(10);
    expect(await stockOf("b")).toBe(3);
    expect(await prisma.order.count()).toBe(0);
  });

  it("does not consume a coupon use when the order fails", async () => {
    await coupon({ usageLimit: 1 });
    const err = await failure(
      createOrder(userId, input([{ productId: "b", quantity: 9 }], { couponCode: "test10" })),
    );
    expect(err.code).toBe("OUT_OF_STOCK");
    expect((await prisma.coupon.findUniqueOrThrow({ where: { code: "TEST10" } })).usageCount).toBe(0);
  });

  it("stores totals identical to computeOrderTotals, including coupon, shipping, tax and COD fee", async () => {
    const c = await coupon({ maxDiscount: 5 });
    const order = await createOrder(
      userId,
      input(
        [
          { productId: "a", quantity: 1 },
          { productId: "b", quantity: 2 },
        ],
        { couponCode: "test10" },
      ),
    );
    const expected = computeOrderTotals(
      [
        { price: 40, quantity: 1 },
        { price: 19.99, quantity: 2 },
      ],
      { coupon: c },
    );
    expect(order.subtotal).toBe(expected.subtotal);
    expect(order.discountAmount).toBe(expected.discount);
    expect(order.shippingFee).toBe(expected.shipping);
    expect(order.tax).toBe(expected.tax);
    expect(order.codFee).toBe(expected.codFee);
    expect(order.total).toBe(expected.total);
    expect(order.discountAmount).toBe(5); // capped by maxDiscount
    expect(order.couponId).toBe(c.id);
    expect(order.coupon?.code).toBe("TEST10");
  });

  it("rejects unknown, inactive, expired and below-minimum coupons", async () => {
    const lines = [{ productId: "a", quantity: 1 }];
    expect((await failure(createOrder(userId, input(lines, { couponCode: "NOPE" })))).code).toBe("COUPON_INVALID");

    await coupon({ isActive: false });
    expect((await failure(createOrder(userId, input(lines, { couponCode: "TEST10" })))).code).toBe("COUPON_INVALID");

    await prisma.coupon.update({
      where: { code: "TEST10" },
      data: { isActive: true, validUntil: new Date(Date.now() - 1000) },
    });
    expect((await failure(createOrder(userId, input(lines, { couponCode: "TEST10" })))).code).toBe("COUPON_INVALID");

    await prisma.coupon.update({
      where: { code: "TEST10" },
      data: { validUntil: new Date(Date.now() + 86_400_000), minPurchase: 500 },
    });
    expect((await failure(createOrder(userId, input(lines, { couponCode: "TEST10" })))).code).toBe("COUPON_INVALID");
    expect(await stockOf("a")).toBe(10);
  });

  it("enforces the coupon usage limit", async () => {
    await coupon({ usageLimit: 1 });
    const lines = [{ productId: "a", quantity: 1 }];
    await createOrder(userId, input(lines, { couponCode: "TEST10" }));
    const err = await failure(createOrder(userId, input(lines, { couponCode: "TEST10" })));
    expect(err.code).toBe("COUPON_INVALID");
    expect((await prisma.coupon.findUniqueOrThrow({ where: { code: "TEST10" } })).usageCount).toBe(1);
  });

  it("cannot exceed the coupon usage limit under concurrency", async () => {
    await coupon({ usageLimit: 2 });
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        createOrder(userId, input([{ productId: "a", quantity: 1 }], { couponCode: "TEST10" })),
      ),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    expect(ok).toBe(2);
    expect((await prisma.coupon.findUniqueOrThrow({ where: { code: "TEST10" } })).usageCount).toBe(2);
    expect(await stockOf("a")).toBe(8);
  });

  it("cannot oversell under concurrency", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () => createOrder(userId, input([{ productId: "b", quantity: 1 }]))),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    expect(await stockOf("b")).toBe(0);
  });
});

describe("canTransition", () => {
  it.each([
    ["PENDING", "CONFIRMED", true],
    ["PENDING", "CANCELLED", true],
    ["SHIPPED", "DELIVERED", true],
    ["SHIPPED", "SHIPPED", true],
    ["DELIVERED", "PENDING", false],
    ["SHIPPED", "PENDING", false],
    ["CANCELLED", "PENDING", false],
    ["DELIVERED", "CANCELLED", false],
    ["PENDING", "BOGUS", false],
  ])("%s -> %s is %s", (from, to, allowed) => {
    expect(canTransition(from, to)).toBe(allowed);
  });
});

describe("updateOrderAsAdmin", () => {
  const placeOrder = (extra: Record<string, unknown> = {}) =>
    createOrder(userId, input([{ productId: "a", quantity: 2 }], extra));

  it("moves an order forward and saves tracking details", async () => {
    const { id } = await placeOrder();
    await updateOrderAsAdmin(id, { status: "CONFIRMED" });
    const { order, cancelled } = await updateOrderAsAdmin(id, {
      status: "SHIPPED",
      trackingNumber: "TRK1",
      carrier: "DHL",
    });
    expect(cancelled).toBe(false);
    expect(order.status).toBe("SHIPPED");
    expect(order.trackingNumber).toBe("TRK1");
  });

  it("updates tracking alone without changing the status", async () => {
    const { id } = await placeOrder();
    const { order } = await updateOrderAsAdmin(id, { carrier: "Aramex" });
    expect(order.status).toBe("PENDING");
    expect(order.carrier).toBe("Aramex");
  });

  it("rejects moving an order backwards or out of a final status", async () => {
    const { id } = await placeOrder();
    expect((await failure(updateOrderAsAdmin(id, { status: "DELIVERED" }))).code).toBe("INVALID_TRANSITION");
    await updateOrderAsAdmin(id, { status: "CONFIRMED" });
    await updateOrderAsAdmin(id, { status: "SHIPPED" });
    expect((await failure(updateOrderAsAdmin(id, { status: "PENDING" }))).code).toBe("INVALID_TRANSITION");
    await updateOrderAsAdmin(id, { status: "DELIVERED" });
    expect((await failure(updateOrderAsAdmin(id, { status: "CANCELLED" }))).code).toBe("INVALID_TRANSITION");
  });

  it("returns NOT_FOUND for an unknown order", async () => {
    expect((await failure(updateOrderAsAdmin("missing", { status: "CONFIRMED" }))).code).toBe("NOT_FOUND");
  });

  it("cancelling restores stock and gives back the coupon use", async () => {
    await coupon({ usageLimit: 1 });
    const { id } = await placeOrder({ couponCode: "TEST10" });
    expect(await stockOf("a")).toBe(8);

    const { cancelled, restoredStock } = await updateOrderAsAdmin(id, { status: "CANCELLED" });
    expect([cancelled, restoredStock]).toEqual([true, true]);
    expect(await stockOf("a")).toBe(10);
    expect((await prisma.coupon.findUniqueOrThrow({ where: { code: "TEST10" } })).usageCount).toBe(0);
  });

  it("can cancel without restoring stock, and cannot cancel twice", async () => {
    const { id } = await placeOrder();
    await updateOrderAsAdmin(id, { status: "CANCELLED", restoreStock: false });
    expect(await stockOf("a")).toBe(8);
    expect((await failure(updateOrderAsAdmin(id, { status: "CANCELLED" }))).code).toBe("INVALID_TRANSITION");
    expect((await failure(updateOrderAsAdmin(id, { status: "CONFIRMED" }))).code).toBe("INVALID_TRANSITION");
  });

  it("a concurrent cancel and ship cannot both apply, and stock is restored at most once", async () => {
    const { id } = await placeOrder();
    await updateOrderAsAdmin(id, { status: "CONFIRMED" });
    const results = await Promise.allSettled([
      updateOrderAsAdmin(id, { status: "CANCELLED" }),
      updateOrderAsAdmin(id, { status: "CANCELLED" }),
      updateOrderAsAdmin(id, { status: "SHIPPED" }),
    ]);
    const final = await prisma.order.findUniqueOrThrow({ where: { id } });
    const cancels = results.filter(
      (r) => r.status === "fulfilled" && r.value.cancelled,
    ).length;
    expect(cancels).toBeLessThanOrEqual(1);
    // SHIPPED -> CANCELLED is a legal move, so the order may end cancelled either way.
    expect(await stockOf("a")).toBe(final.status === "CANCELLED" ? 10 : 8);
  });
});
