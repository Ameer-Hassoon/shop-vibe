import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// Cancelled orders never count as revenue or sales.
const COUNTED = { status: { not: "CANCELLED" } } as const;

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalRevenue,
      recentRevenue,
      totalOrders,
      totalCustomers,
      recentOrders,
      topSold,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.aggregate({ where: COUNTED, _sum: { total: true } }),
      prisma.order.aggregate({
        where: { ...COUNTED, createdAt: { gte: thirtyDaysAgo } },
        _sum: { total: true },
      }),
      prisma.order.count(),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      // units sold per product (sum of quantities, not number of order lines)
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: COUNTED },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: "asc" },
        take: 10,
      }),
    ]);

    const topProductRows = await prisma.product.findMany({
      where: { id: { in: topSold.map((t) => t.productId) } },
      select: { id: true, name: true, image: true, price: true, stock: true },
    });
    const byId = new Map(topProductRows.map((p) => [p.id, p]));
    const topProducts = topSold.flatMap((t) => {
      const p = byId.get(t.productId);
      return p ? [{ ...p, totalSold: t._sum.quantity ?? 0 }] : [];
    });

    return NextResponse.json({
      overview: {
        totalRevenue: totalRevenue._sum.total || 0,
        totalOrders,
        totalCustomers,
        recentRevenue: recentRevenue._sum.total || 0,
      },
      recentOrders,
      topProducts,
      lowStockProducts,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to get analytics", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
