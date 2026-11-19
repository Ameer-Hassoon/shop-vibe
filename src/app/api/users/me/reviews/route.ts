import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    const searchParams = request.nextUrl.searchParams;
    let page = parseInt(searchParams.get("page") || "1", 10);
    if (Number.isNaN(page) || page < 1) page = 1;

    let limit = parseInt(searchParams.get("limit") || "10", 10);
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    limit = Math.min(limit, 50);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
              price: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get user reviews error:", error);
    return NextResponse.json(
      { error: "Failed to get reviews", code: "INTERNAL" },
      { status: 500 }
    );
  }
}
