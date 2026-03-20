import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let page = parseInt(searchParams.get("page") || "1", 10);
    if (Number.isNaN(page) || page < 1) page = 1;

    let limit = parseInt(searchParams.get("limit") || "20", 10);
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    limit = Math.min(limit, 50);

    const approved = searchParams.get("approved");

    const where = approved !== null ? { isApproved: approved === "true" } : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
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
    console.error("Get all reviews error:", error);
    return NextResponse.json(
      { error: "Failed to get reviews" },
      { status: 500 },
    );
  }
}
