import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminOrderUpdateSchema, parseBody } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
                stock: true,
              },
            },
          },
        },
        coupon: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Admin order fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order", code: "INTERNAL" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const { id } = await params;
    const parsed = await parseBody(request, adminOrderUpdateSchema);
    if (parsed.response) return parsed.response;
    const { status, trackingNumber, carrier, estimatedDelivery } = parsed.data;
    // Cancelling returns the stock unless the admin explicitly opts out.
    const restoreStock = parsed.data.restoreStock ?? true;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found", code: "NOT_FOUND" }, { status: 404 });
    }

    if (existingOrder.status === "CANCELLED" && status && status !== "CANCELLED") {
      return NextResponse.json(
        { error: "A cancelled order cannot be reopened", code: "INVALID_TRANSITION" },
        { status: 409 },
      );
    }

    const include = {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
      coupon: true,
    };

    if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
      const order = await prisma.$transaction(async (tx) => {
        // Conditional update: of two concurrent cancels only one wins, so stock is
        // restored at most once.
        const claimed = await tx.order.updateMany({
          where: { id, status: { not: "CANCELLED" } },
          data: { status: "CANCELLED" },
        });
        if (claimed.count === 0) return null;
        if (restoreStock) {
          for (const item of existingOrder.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
        return tx.order.findUniqueOrThrow({ where: { id }, include });
      });

      if (!order) {
        return NextResponse.json(
          { error: "Order is already cancelled", code: "INVALID_TRANSITION" },
          { status: 409 },
        );
      }

      return NextResponse.json({
        order,
        message: restoreStock ? "Order cancelled and stock restored" : "Order cancelled",
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(carrier !== undefined && { carrier }),
        ...(estimatedDelivery !== undefined && {
          estimatedDelivery: estimatedDelivery === null ? null : new Date(estimatedDelivery),
        }),
      },
      include,
    });

    return NextResponse.json({ order, message: "Order updated successfully" });
  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
