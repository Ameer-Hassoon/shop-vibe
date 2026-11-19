import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { couponDiscount } from "@/lib/pricing";
import { assertCouponUsable, OrderError } from "@/lib/orders";

const invalid = (error: string) =>
  NextResponse.json({ error, code: "COUPON_INVALID" }, { status: 400 });

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")?.trim();
    const cartTotal = Number(request.nextUrl.searchParams.get("cartTotal") ?? "0");

    if (!Number.isFinite(cartTotal) || cartTotal < 0) {
      return invalid("Invalid cart total");
    }
    if (!code || code.length > 50) {
      return invalid("Coupon code is required");
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    try {
      assertCouponUsable(coupon, cartTotal);
    } catch (err) {
      if (err instanceof OrderError) return invalid(err.message);
      throw err;
    }
    // assertCouponUsable throws for null, so coupon is set here.
    const c = coupon!;

    return NextResponse.json(
      {
        valid: true,
        code: c.code,
        type: c.type,
        value: c.value,
        minPurchase: c.minPurchase,
        maxDiscount: c.maxDiscount,
        freeShipping: c.freeShipping,
        discount: couponDiscount(cartTotal, c),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
