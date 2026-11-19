import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { createOrder, OrderError } from "@/lib/orders";
import { createOrderSchema, parseBody, validationResponse } from "@/lib/validation";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const orders = await prisma.order.findMany({
      where: { userId: auth.user.id },
      include: { items: { include: { product: true } }, coupon: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders", code: "INTERNAL" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    // Client-sent prices/totals are not part of the schema and are ignored.
    const parsed = await parseBody(request, createOrderSchema);
    if (parsed.response) return parsed.response;

    let order;
    try {
      order = await createOrder(auth.user.id, parsed.data);
    } catch (err) {
      if (err instanceof OrderError) {
        if (err.code === "VALIDATION") {
          return validationResponse(err.fields ?? {}, err.message);
        }
        return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      }
      throw err;
    }

    if (auth.user.email) {
      sendOrderConfirmationEmail({
        email: auth.user.email,
        orderId: order.id,
        items: order.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: order.subtotal,
        discount: order.discountAmount,
        shippingFee: order.shippingFee,
        tax: order.tax,
        codFee: order.codFee,
        total: order.total,
        shippingAddress: order.shippingAddress,
        city: order.city,
        state: order.state,
        zipCode: order.zipCode,
      }).catch((err) => {
        console.error(`Failed to send order confirmation for order ${order.id}:`, err);
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
