import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// Admins update orders through PUT /api/admin/orders/[id] (status transitions, stock restore).

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { id } = await params;
    const isAdmin = auth.user.role === "ADMIN";

    // Scoping the query by owner means another user's order is indistinguishable from a
    // missing one (404, not 403), so order ids cannot be probed.
    const order = await prisma.order.findFirst({
      where: isAdmin ? { id } : { id, userId: auth.user.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, image: true, price: true } },
          },
        },
        coupon: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Failed to get order", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
