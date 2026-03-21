import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Admin order fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, trackingNumber, carrier, estimatedDelivery, restoreStock } =
      body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const validStatuses = [
      "PENDING",
      "PROCESSING",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 },
      );
    }

    if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
      const order = await prisma.$transaction(async (tx) => {
        if (restoreStock) {
          for (const item of existingOrder.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
        return tx.order.update({
          where: { id },
          data: { status: "CANCELLED" },
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: { include: { product: true } },
          },
        });
      });

      return NextResponse.json({
        order,
        message: restoreStock
          ? "Order cancelled and stock restored"
          : "Order cancelled",
      });
    }

    let validatedEstimatedDelivery: Date | null = null;
    if (estimatedDelivery !== undefined) {
      if (estimatedDelivery === null) {
        validatedEstimatedDelivery = null;
      } else {
        const ts = Date.parse(estimatedDelivery);
        if (isNaN(ts)) {
          return NextResponse.json(
            { error: "Invalid estimated delivery date" },
            { status: 400 },
          );
        }
        validatedEstimatedDelivery = new Date(ts);
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(carrier !== undefined && { carrier }),
        ...(estimatedDelivery !== undefined && {
          estimatedDelivery: validatedEstimatedDelivery,
        }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: { product: true },
        },
        coupon: true,
      },
    });

    return NextResponse.json({ order, message: "Order updated successfully" });
  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}
