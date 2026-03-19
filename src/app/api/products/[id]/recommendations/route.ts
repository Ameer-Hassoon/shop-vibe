import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const boughtTogether = await prisma.orderItem.findMany({
      where: {
        order: {
          items: {
            some: { productId: id },
          },
        },
      },
      select: { productId: true },
      distinct: ['productId'],
    });

    const relatedProductIds = boughtTogether
      .filter((item) => item.productId !== id)
      .slice(0, 4)
      .map((item) => item.productId);

    const trendingProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 8,
    });

    const trendingIds = trendingProducts
      .filter((p) => p.productId !== id)
      .slice(0, 4)
      .map((p) => p.productId);

    const [boughtTogetherProducts, trending] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: relatedProductIds } },
        select: { id: true, name: true, price: true, image: true, category: true, stock: true },
      }),
      prisma.product.findMany({
        where: { id: { in: trendingIds } },
        select: { id: true, name: true, price: true, image: true, category: true, stock: true },
      }),
    ]);

    return NextResponse.json({
      frequentlyBoughtTogether: boughtTogetherProducts,
      trending,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 });
  }
}
