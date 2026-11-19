import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Recomputes a product's averageRating / reviewCount from its approved reviews. */
export async function recalculateProductRating(
  productId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma,
) {
  const stats = await db.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await db.product.update({
    where: { id: productId },
    data: {
      averageRating: Math.round((stats._avg.rating ?? 0) * 100) / 100,
      reviewCount: stats._count,
    },
  });
}
