/**
 * Single source of truth for order totals. Used by the checkout page (preview) and by
 * POST /api/orders (authoritative). Pure: no I/O, safe to import on client and server.
 *
 * All amounts are handled in integer cents internally to avoid float drift, and returned
 * as numbers with 2 decimals.
 */

export const FREE_SHIPPING_THRESHOLD = 100;
export const SHIPPING_FEE = 9.99;
export const TAX_RATE = 0.08;
export const COD_FEE = 3;

export type PaymentMethod = "cod";

export interface PricingLine {
  price: number;
  quantity: number;
}

export interface PricingCoupon {
  type: string; // "PERCENTAGE" | "FIXED"
  value: number;
  minPurchase: number;
  maxDiscount: number | null;
  freeShipping: boolean;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  codFee: number;
  total: number;
}

const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

/** Discount a coupon gives on a subtotal (0 if the minimum purchase is not met). */
export function couponDiscount(subtotal: number, coupon: PricingCoupon | null | undefined): number {
  if (!coupon || subtotal < coupon.minPurchase) return 0;
  const sub = toCents(subtotal);
  let d =
    coupon.type === "PERCENTAGE"
      ? Math.round((sub * coupon.value) / 100)
      : toCents(coupon.value);
  if (coupon.maxDiscount != null) d = Math.min(d, toCents(coupon.maxDiscount));
  return fromCents(Math.max(0, Math.min(d, sub)));
}

export function computeOrderTotals(
  lines: PricingLine[],
  options: { coupon?: PricingCoupon | null; paymentMethod?: PaymentMethod } = {},
): OrderTotals {
  const { coupon = null, paymentMethod = "cod" } = options;

  const subtotalC = lines.reduce((sum, l) => sum + toCents(l.price) * l.quantity, 0);
  const subtotal = fromCents(subtotalC);
  const discountC = toCents(couponDiscount(subtotal, coupon));
  const discountedC = subtotalC - discountC;

  const freeShipping =
    subtotalC === 0 ||
    subtotal >= FREE_SHIPPING_THRESHOLD ||
    Boolean(coupon?.freeShipping && subtotal >= coupon.minPurchase);
  const shippingC = freeShipping ? 0 : toCents(SHIPPING_FEE);
  const taxC = Math.round(discountedC * TAX_RATE);
  const codFeeC = paymentMethod === "cod" && subtotalC > 0 ? toCents(COD_FEE) : 0;

  return {
    subtotal,
    discount: fromCents(discountC),
    shipping: fromCents(shippingC),
    tax: fromCents(taxC),
    codFee: fromCents(codFeeC),
    total: fromCents(discountedC + shippingC + taxC + codFeeC),
  };
}
