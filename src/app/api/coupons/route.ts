import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const cartTotalRaw = request.nextUrl.searchParams.get("cartTotal") ?? "0";
    const cartTotal = parseFloat(cartTotalRaw);

    if (!Number.isFinite(cartTotal)) {
      return NextResponse.json(
        { error: "Invalid cart total" },
        { status: 400 },
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 },
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 400 },
      );
    }

    const now = new Date();
    if (!coupon.isActive || now < coupon.validFrom || now > coupon.validUntil) {
      return NextResponse.json(
        { error: "This coupon is no longer valid" },
        { status: 400 },
      );
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit" },
        { status: 400 },
      );
    }

    if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
      return NextResponse.json(
        {
          error: `Minimum purchase of $${coupon.minPurchase.toFixed(2)} required`,
        },
        { status: 400 },
      );
    }

    let discount = 0;
    if (coupon.type === "PERCENTAGE") {
      discount = cartTotal * (coupon.value / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.value;
    }

    return NextResponse.json({
      valid: true,
      type: coupon.type,
      value: coupon.value,
      discount: Math.min(discount, cartTotal),
      freeShipping: coupon.freeShipping,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 },
    );
  }
}
