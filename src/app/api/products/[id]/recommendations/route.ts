import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cancelled orders are not real purchases, so they never drive recommendations.
const NOT_CANCELLED = { status: { not: "CANCELLED" } } as const;

const productSelect = {
  id: true,
  name: true,
  price: true,
  image: true,
  category: true,
  stock: true,
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [boughtTogether, trendingProducts] = await Promise.all([
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: { ...NOT_CANCELLED, items: { some: { productId: id } } } },
        _count: { productId: true },
        orderBy: { _count: { productId: "desc" } },
        take: 5,
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: NOT_CANCELLED },
        _count: { productId: true },
        orderBy: { _count: { productId: "desc" } },
        take: 8,
      }),
    ]);

    const relatedProductIds = boughtTogether
      .map((item) => item.productId)
      .filter((productId) => productId !== id)
      .slice(0, 4);

    const trendingIds = trendingProducts
      .map((p) => p.productId)
      .filter((productId) => productId !== id)
      .slice(0, 4);

    // `id IN (...)` returns rows in any order; put them back in popularity order.
    const findInOrder = async (ids: string[]) => {
      const rows = await prisma.product.findMany({ where: { id: { in: ids } }, select: productSelect });
      return rows.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    };

    const [frequentlyBoughtTogether, trending] = await Promise.all([
      findInOrder(relatedProductIds),
      findInOrder(trendingIds),
    ]);

    return NextResponse.json(
      { frequentlyBoughtTogether, trending },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
