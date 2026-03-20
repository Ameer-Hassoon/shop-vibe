import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      recentOrders,
      topProducts,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.aggregate({ _sum: { total: true } }),
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
      prisma.product.findMany({
        where: {
          orderItems: { some: {} },
        },
        include: {
          _count: { select: { orderItems: true } },
        },
        orderBy: { orderItems: { _count: "desc" } },
        take: 10,
      }),
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: "asc" },
        take: 10,
      }),
    ]);

    const recentRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    return NextResponse.json({
      overview: {
        totalRevenue: totalRevenue._sum.total || 0,
        totalOrders,
        totalCustomers,
        recentRevenue: recentRevenue._sum.total || 0,
      },
      recentOrders,
      topProducts: topProducts.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.image,
        price: p.price,
        stock: p.stock,
        totalSold: p._count.orderItems,
      })),
      lowStockProducts,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to get analytics" },
      { status: 500 },
    );
  }
}
