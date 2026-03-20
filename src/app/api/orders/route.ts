import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;

    const body = await request.json();
    const { items, shippingAddress, city, state, zipCode } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    class NotFoundError extends Error {
      constructor(productId: string) {
        super(`Product not found: ${productId}`);
        this.name = "NotFoundError";
      }
    }
    type ProductForError = { id: string; name: string; stock: number };

    class InsufficientStockError extends Error {
      product: ProductForError;
      constructor(product: ProductForError) {
        super(
          `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
        );
        this.name = "InsufficientStockError";
        this.product = product;
      }
    }

    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        // Fetch all products for authoritative price/validation
        const productIds = items.map(
          (item: { productId: string }) => item.productId,
        );
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));

        let computedTotal = 0;
        const orderItems = items.map(
          (item: { productId: string; quantity: number }) => {
            const product = productMap.get(item.productId);
            if (!product) throw new NotFoundError(item.productId);
            computedTotal += product.price * item.quantity;
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product.price,
            };
          },
        );

        for (const item of items) {
          // Try to decrement stock only if enough is available
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            // Check if product exists
            const product = await tx.product.findUnique({
              where: { id: item.productId },
            });
            if (!product) {
              throw new NotFoundError(item.productId);
            }
            throw new InsufficientStockError(product);
          }
        }

        return tx.order.create({
          data: {
            userId,
            total: computedTotal,
            shippingAddress,
            city,
            state,
            zipCode,
            status: "CONFIRMED",
            items: {
              create: orderItems,
            },
          },
          include: { items: { include: { product: true } } },
        });
      });
    } catch (err: unknown) {
      if (err instanceof NotFoundError) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 400 },
        );
      }
      if (err instanceof InsufficientStockError) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${err.product.name}. Only ${err.product.stock} available.`,
          },
          { status: 400 },
        );
      }
      throw err;
    }

    if (userEmail) {
      sendOrderConfirmationEmail({
        email: userEmail,
        orderId: order.id,
        items: order.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total,
        shippingAddress: order.shippingAddress,
        city: order.city,
        state: order.state,
        zipCode: order.zipCode,
      }).catch((err) => {
        console.error(
          `Failed to send order confirmation for order ${order.id}:`,
          err,
        );
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
