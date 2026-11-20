import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isOrderStatus } from "@/lib/orderStatus";
import { hideCustomerDetails } from "@/lib/orders";

const ITEMS_PER_PAGE = 20;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const searchParams = request.nextUrl.searchParams;
    let page = parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    let sortBy = searchParams.get("sortBy") || "createdAt";
    let sortOrder = searchParams.get("sortOrder") || "desc";

    const allowedSortFields = ["createdAt", "updatedAt", "total", "status"];
    if (!allowedSortFields.includes(sortBy)) {
      sortBy = "createdAt";
    }
    if (sortOrder !== "asc" && sortOrder !== "desc") {
      sortOrder = "desc";
    }
    if (Number.isNaN(page) || !Number.isInteger(page) || page < 1) {
      page = 1;
    }

    const where: Record<string, unknown> = {};

    if (isOrderStatus(status)) {
      where.status = status;
    }

    if (search) {
      const term = search.trim().slice(0, 100);
      // The read-only demo admin may only search by order id, not probe for customers.
      where.OR = auth.user.readOnly
        ? [{ id: { contains: term, mode: "insensitive" } }]
        : [
            { id: { contains: term, mode: "insensitive" } },
            { user: { email: { contains: term, mode: "insensitive" } } },
            { user: { name: { contains: term, mode: "insensitive" } } },
          ];
    }

    if (startDate || endDate) {
      let parsedStart: Date | undefined;
      let parsedEnd: Date | undefined;

      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          parsedStart = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          // "2026-11-19" parses as UTC midnight, so extend to the end of that UTC day.
          end.setUTCHours(23, 59, 59, 999);
          parsedEnd = end;
        }
      }

      if (parsedStart || parsedEnd) {
        where.createdAt = {};
        if (parsedStart) {
          (where.createdAt as Record<string, Date>).gte = parsedStart;
        }
        if (parsedEnd) {
          (where.createdAt as Record<string, Date>).lte = parsedEnd;
        }
      }
    }

    const [orders, total, statusCounts] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, image: true } },
            },
          },
          coupon: { select: { code: true, type: true, value: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    const statusBreakdown = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    return NextResponse.json({
      orders: auth.user.readOnly ? orders.map(hideCustomerDetails) : orders,
      pagination: {
        page,
        limit: ITEMS_PER_PAGE,
        total,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      },
      statusBreakdown,
    });
  } catch (error) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
