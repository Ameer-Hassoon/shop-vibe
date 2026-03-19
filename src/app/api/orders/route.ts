import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    const body = await request.json();
    const { items, shippingAddress, city, state, zipCode, total } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }

    for (const item of items) {
      const product = await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      if (product.stock < 0) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${product.name}. Only ${product.stock + item.quantity} available.` 
        }, { status: 400 });
      }
    }

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        shippingAddress,
        city,
        state,
        zipCode,
        status: 'CONFIRMED',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (userEmail) {
      const emailItems = order.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      }));

      await sendOrderConfirmationEmail({
        email: userEmail,
        orderId: order.id,
        items: emailItems,
        total: order.total,
        shippingAddress: order.shippingAddress,
        city: order.city,
        state: order.state,
        zipCode: order.zipCode,
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
