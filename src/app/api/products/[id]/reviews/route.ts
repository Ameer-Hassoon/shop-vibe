import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { recalculateProductRating } from "@/lib/ratings";
import { parseBody, reviewCreateSchema, reviewUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

// A review needs a purchase that the shop has accepted (not pending/cancelled).
const REVIEWABLE_ORDER_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

const userSelect = { select: { id: true, name: true } };

const error = (message: string, code: string, status: number) =>
  NextResponse.json({ error: message, code }, { status });

const internal = (message: string) => error(message, "INTERNAL", 500);

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

    const [reviews, aggregate, ratingDistribution] = await Promise.all([
      prisma.review.findMany({
        where: { productId: id, isApproved: true },
        include: { user: userSelect },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.aggregate({
        where: { productId: id, isApproved: true },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { productId: id, isApproved: true },
        _count: true,
      }),
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) distribution[r.rating] = r._count;
    });

    return NextResponse.json(
      {
        reviews,
        summary: {
          averageRating: aggregate._avg.rating || 0,
          totalReviews: aggregate._count,
          distribution,
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (e) {
    console.error("Get reviews error:", e);
    return internal("Failed to get reviews");
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const userId = auth.user.id;
    const { id: productId } = await params;

    const parsed = await parseBody(request, reviewCreateSchema);
    if (parsed.response) return parsed.response;
    const { rating, title, content } = parsed.data;

    if (!(await prisma.product.findUnique({ where: { id: productId }, select: { id: true } }))) {
      return error("Product not found", "NOT_FOUND", 404);
    }

    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: { in: REVIEWABLE_ORDER_STATUSES } },
      },
      select: { id: true },
    });
    if (!hasPurchased) {
      return error("You must purchase this product before leaving a review", "NOT_PURCHASED", 403);
    }

    try {
      const review = await prisma.$transaction(async (tx) => {
        const created = await tx.review.create({
          data: { userId, productId, rating, title, content, isVerified: true, isApproved: true },
          include: { user: userSelect },
        });
        await recalculateProductRating(productId, tx);
        return created;
      });
      return NextResponse.json(review, { status: 201 });
    } catch (e) {
      // @@unique([userId, productId]): also covers two concurrent submissions
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return error("You have already reviewed this product", "ALREADY_REVIEWED", 409);
      }
      throw e;
    }
  } catch (e) {
    console.error("Create review error:", e);
    return internal("Failed to create review");
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { id: productId } = await params;

    const parsed = await parseBody(request, reviewUpdateSchema);
    if (parsed.response) return parsed.response;
    const { reviewId, rating, title, content } = parsed.data;

    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing || existing.productId !== productId) {
      return error("Review not found", "NOT_FOUND", 404);
    }
    if (existing.userId !== auth.user.id) {
      return error("You can only edit your own reviews", "FORBIDDEN", 403);
    }

    const review = await prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: { rating, title, content },
        include: { user: userSelect },
      });
      await recalculateProductRating(productId, tx);
      return updated;
    });

    return NextResponse.json(review);
  } catch (e) {
    console.error("Update review error:", e);
    return internal("Failed to update review");
  }
}

/** DELETE /api/products/[id]/reviews?reviewId=... — the author or an admin. */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { id: productId } = await params;

    const reviewId = request.nextUrl.searchParams.get("reviewId");
    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required", code: "VALIDATION", fields: { reviewId: "Review ID is required" } },
        { status: 400 },
      );
    }

    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing || existing.productId !== productId) {
      return error("Review not found", "NOT_FOUND", 404);
    }
    if (existing.userId !== auth.user.id && auth.user.role !== "ADMIN") {
      return error("You can only delete your own reviews", "FORBIDDEN", 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await recalculateProductRating(productId, tx);
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Delete review error:", e);
    return internal("Failed to delete review");
  }
}
