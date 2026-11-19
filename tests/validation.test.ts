import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  createOrderSchema,
  newsletterSchema,
  productCreateSchema,
  productUpdateSchema,
  registerSchema,
  reviewCreateSchema,
  zodFields,
} from "@/lib/validation";

const validOrder = {
  items: [{ productId: "p1", quantity: 2 }],
  shippingAddress: "  1 Main St ",
  city: "Cairo",
  state: "Cairo",
  zipCode: "11511",
  phone: "+20 100-123-4567",
  paymentMethod: "cod",
};

const failFields = (schema: z.ZodType, v: unknown) => {
  const r = schema.safeParse(v);
  expect(r.success).toBe(false);
  return r.success ? {} : zodFields(r.error);
};

describe("createOrderSchema", () => {
  it("accepts a valid order, trims text and defaults the payment method", () => {
    const r = createOrderSchema.parse({ ...validOrder, paymentMethod: undefined, couponCode: " welcome10 " });
    expect(r.shippingAddress).toBe("1 Main St");
    expect(r.paymentMethod).toBe("cod");
    expect(r.couponCode).toBe("WELCOME10");
  });

  it("strips client-sent prices and totals", () => {
    const r = createOrderSchema.parse({
      ...validOrder,
      total: 0.01,
      items: [{ productId: "p1", quantity: 1, price: 0.01 }],
    }) as Record<string, unknown>;
    expect(r.total).toBeUndefined();
    expect((r.items as Record<string, unknown>[])[0].price).toBeUndefined();
  });

  it.each([-5, 0, 1.5, 100, "3", null, NaN])("rejects quantity %s", (quantity) => {
    const f = failFields(createOrderSchema, { ...validOrder, items: [{ productId: "p1", quantity }] });
    expect(Object.keys(f)[0]).toBe("items.0.quantity");
  });

  it("limits the number of items to 1-50", () => {
    expect(Object.keys(failFields(createOrderSchema, { ...validOrder, items: [] }))).toContain("items");
    const many = Array.from({ length: 51 }, (_, i) => ({ productId: `p${i}`, quantity: 1 }));
    expect(Object.keys(failFields(createOrderSchema, { ...validOrder, items: many }))).toContain("items");
    const fifty = many.slice(0, 50);
    expect(createOrderSchema.safeParse({ ...validOrder, items: fifty }).success).toBe(true);
  });

  it("rejects blank address fields", () => {
    const f = failFields(createOrderSchema, {
      ...validOrder,
      shippingAddress: "   ",
      city: "",
      state: " ",
      zipCode: "",
    });
    expect(Object.keys(f)).toEqual(expect.arrayContaining(["shippingAddress", "city", "state", "zipCode"]));
  });

  it.each(["123456", "x".repeat(21), "abc-defg-hij", "(555) 123 4567", ""])("rejects phone %j", (phone) => {
    expect(Object.keys(failFields(createOrderSchema, { ...validOrder, phone }))).toContain("phone");
  });

  it.each(["1234567", "+20 100 123 4567", "555-123-4567"])("accepts phone %j", (phone) => {
    expect(createOrderSchema.safeParse({ ...validOrder, phone }).success).toBe(true);
  });

  it("only allows cash on delivery", () => {
    expect(Object.keys(failFields(createOrderSchema, { ...validOrder, paymentMethod: "card" }))).toContain(
      "paymentMethod",
    );
  });
});

describe("registerSchema", () => {
  it("normalises the email", () => {
    expect(registerSchema.parse({ email: "  Jane@Example.COM ", password: "longenough" }).email).toBe(
      "jane@example.com",
    );
  });

  it("rejects bad email and short or oversized passwords", () => {
    expect(Object.keys(failFields(registerSchema, { email: "nope", password: "longenough" }))).toContain("email");
    expect(Object.keys(failFields(registerSchema, { email: "a@b.co", password: "short" }))).toContain("password");
    expect(Object.keys(failFields(registerSchema, { email: "a@b.co", password: "x".repeat(73) }))).toContain(
      "password",
    );
  });
});

describe("product schemas", () => {
  const product = {
    name: "Mug",
    description: "A mug",
    price: "12.50",
    image: "https://images.unsplash.com/photo-1",
    category: "Kitchen & Dining",
    stock: "5",
  };

  it("coerces numeric strings from admin forms", () => {
    const r = productCreateSchema.parse(product);
    expect(r.price).toBe(12.5);
    expect(r.stock).toBe(5);
  });

  it("rejects negative price, fractional stock and non-http images", () => {
    const f = failFields(productCreateSchema, { ...product, price: -1, stock: 1.5, image: "javascript:alert(1)" });
    expect(Object.keys(f)).toEqual(expect.arrayContaining(["price", "stock", "image"]));
  });

  it("update allows partial bodies but not empty ones", () => {
    expect(productUpdateSchema.parse({ stock: 0 })).toEqual({ stock: 0 });
    expect(productUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe("review and newsletter schemas", () => {
  it("validates rating range and content length", () => {
    expect(reviewCreateSchema.safeParse({ rating: 5, content: "Really good product" }).success).toBe(true);
    expect(Object.keys(failFields(reviewCreateSchema, { rating: 6, content: "Really good product" }))).toContain("rating");
    expect(Object.keys(failFields(reviewCreateSchema, { rating: 4, content: "short" }))).toContain("content");
  });

  it("normalises newsletter emails", () => {
    expect(newsletterSchema.parse({ email: " A@B.io " }).email).toBe("a@b.io");
    expect(newsletterSchema.safeParse({ email: "bad" }).success).toBe(false);
  });
});
