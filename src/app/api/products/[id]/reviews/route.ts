import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const reviews = await prisma.review.findMany({
      where: { productId: id, isApproved: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const aggregate = await prisma.review.aggregate({
      where: { productId: id, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    const ratingDistribution = await prisma.review.groupBy({
      by: ["rating"],
      where: { productId: id, isApproved: true },
      _count: true,
    });

    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    ratingDistribution.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating] = r._count;
      }
    });

    return NextResponse.json({
      reviews,
      summary: {
        averageRating: aggregate._avg.rating || 0,
        totalReviews: aggregate._count,
        distribution,
      },
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { error: "Failed to get reviews" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;
    const userId = (session.user as { id?: string }).id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rating, title, content } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Review content must be at least 10 characters" },
        { status: 400 },
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 },
      );
    }

    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] },
        },
      },
    });

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title: title?.trim() || null,
        content: content.trim(),
        isVerified: !!hasPurchased,
        isApproved: !!hasPurchased, // Only auto-approve for verified purchasers
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const ratingStats = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: ratingStats._avg.rating || 0,
        reviewCount: ratingStats._count,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;
    const userId = (session.user as { id?: string }).id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId, rating, title, content } = await request.json();

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 },
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Review content must be at least 10 characters" },
        { status: 400 },
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (existingReview.productId !== productId) {
      return NextResponse.json(
        { error: "Review does not belong to this product" },
        { status: 404 },
      );
    }

    if (existingReview.userId !== userId) {
      return NextResponse.json(
        { error: "You can only edit your own reviews" },
        { status: 403 },
      );
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        title: title?.trim() || null,
        content: content.trim(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const ratingStats = await prisma.review.aggregate({
      where: { productId: existingReview.productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: existingReview.productId },
      data: {
        averageRating: ratingStats._avg.rating || 0,
        reviewCount: ratingStats._count,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 },
    );
  }
}
