import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { OrderError, updateOrderAsAdmin } from "@/lib/orders";
import { adminOrderUpdateSchema, parseBody } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
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

    const { order, cancelled, restoredStock } = await updateOrderAsAdmin(id, parsed.data);
    const message = !cancelled
      ? "Order updated successfully"
      : restoredStock
        ? "Order cancelled and stock restored"
        : "Order cancelled";

    return NextResponse.json({ order, message });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("Admin order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
