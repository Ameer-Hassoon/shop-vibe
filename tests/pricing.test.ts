import { describe, expect, it } from "vitest";
import {
  COD_FEE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  TAX_RATE,
  computeOrderTotals,
  couponDiscount,
  type PricingCoupon,
} from "@/lib/pricing";

const coupon = (over: Partial<PricingCoupon> = {}): PricingCoupon => ({
  type: "PERCENTAGE",
  value: 10,
  minPurchase: 0,
  maxDiscount: null,
  freeShipping: false,
  ...over,
});

const line = (price: number, quantity = 1) => ({ price, quantity });

describe("couponDiscount", () => {
  it("returns 0 without a coupon", () => {
    expect(couponDiscount(100, null)).toBe(0);
    expect(couponDiscount(100, undefined)).toBe(0);
  });

  it("applies a percentage", () => {
    expect(couponDiscount(80, coupon({ value: 25 }))).toBe(20);
  });

  it("applies a fixed amount", () => {
    expect(couponDiscount(80, coupon({ type: "FIXED", value: 15 }))).toBe(15);
  });

  it("caps a percentage coupon at maxDiscount", () => {
    expect(couponDiscount(1000, coupon({ value: 10, maxDiscount: 50 }))).toBe(50);
    expect(couponDiscount(200, coupon({ value: 10, maxDiscount: 50 }))).toBe(20);
  });

  it("gives nothing below minPurchase and applies at exactly minPurchase", () => {
    const c = coupon({ type: "FIXED", value: 20, minPurchase: 100 });
    expect(couponDiscount(99.99, c)).toBe(0);
    expect(couponDiscount(100, c)).toBe(20);
  });

  it("never exceeds the subtotal", () => {
    expect(couponDiscount(12, coupon({ type: "FIXED", value: 20 }))).toBe(12);
  });

  it("is 0 for a fixed-0 free-shipping coupon", () => {
    expect(couponDiscount(50, coupon({ type: "FIXED", value: 0, freeShipping: true }))).toBe(0);
  });

  it("rounds to whole cents", () => {
    // 33.33 * 10% = 3.333 -> 3.33
    expect(couponDiscount(33.33, coupon())).toBe(3.33);
    // 0.05 * 10% = 0.005 -> rounds half up to 0.01
    expect(couponDiscount(0.05, coupon())).toBe(0.01);
  });
});

describe("computeOrderTotals", () => {
  it("is all zero for an empty cart", () => {
    expect(computeOrderTotals([])).toEqual({
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      codFee: 0,
      total: 0,
    });
  });

  it("charges shipping, tax and COD fee below the free-shipping threshold", () => {
    const t = computeOrderTotals([line(50)]);
    expect(t.subtotal).toBe(50);
    expect(t.shipping).toBe(SHIPPING_FEE);
    expect(t.tax).toBe(4);
    expect(t.codFee).toBe(COD_FEE);
    expect(t.total).toBe(66.99);
  });

  it("ships free at exactly the threshold, not just below it", () => {
    expect(computeOrderTotals([line(FREE_SHIPPING_THRESHOLD)]).shipping).toBe(0);
    expect(computeOrderTotals([line(FREE_SHIPPING_THRESHOLD - 0.01)]).shipping).toBe(SHIPPING_FEE);
  });

  it("multiplies price by quantity", () => {
    expect(computeOrderTotals([line(19.99, 3), line(5, 2)]).subtotal).toBe(69.97);
  });

  it("avoids floating point drift", () => {
    // 0.1 + 0.2 style sums
    expect(computeOrderTotals([line(0.1), line(0.2)]).subtotal).toBe(0.3);
    expect(computeOrderTotals([line(1.1, 3)]).subtotal).toBe(3.3);
  });

  it("charges tax on the discounted subtotal", () => {
    const t = computeOrderTotals([line(100)], { coupon: coupon({ value: 10 }) });
    expect(t.discount).toBe(10);
    expect(t.tax).toBe(Math.round(90 * TAX_RATE * 100) / 100);
    expect(t.total).toBe(100.2);
  });

  it("WELCOME10 style coupon honours maxDiscount", () => {
    const t = computeOrderTotals([line(1000)], { coupon: coupon({ value: 10, maxDiscount: 50 }) });
    expect(t.discount).toBe(50);
    expect(t.total).toBe(1029);
  });

  it("SAVE20 style coupon needs the minimum purchase", () => {
    const save20 = coupon({ type: "FIXED", value: 20, minPurchase: 100 });
    expect(computeOrderTotals([line(60)], { coupon: save20 }).discount).toBe(0);
    expect(computeOrderTotals([line(120)], { coupon: save20 }).discount).toBe(20);
  });

  it("FREESHIP coupon removes shipping below the threshold only when minPurchase is met", () => {
    const freeship = coupon({ type: "FIXED", value: 0, freeShipping: true });
    expect(computeOrderTotals([line(40)], { coupon: freeship }).shipping).toBe(0);
    const gated = { ...freeship, minPurchase: 60 };
    expect(computeOrderTotals([line(40)], { coupon: gated }).shipping).toBe(SHIPPING_FEE);
  });

  it("adds the COD fee only when there is something to pay for", () => {
    expect(computeOrderTotals([line(10)], { paymentMethod: "cod" }).codFee).toBe(COD_FEE);
    expect(computeOrderTotals([], { paymentMethod: "cod" }).codFee).toBe(0);
  });

  it("total always equals the sum of its parts", () => {
    const t = computeOrderTotals([line(33.33, 3), line(7.77, 2)], {
      coupon: coupon({ value: 15, maxDiscount: 8 }),
    });
    const sum = Math.round((t.subtotal - t.discount + t.shipping + t.tax + t.codFee) * 100) / 100;
    expect(t.total).toBe(sum);
  });
});
