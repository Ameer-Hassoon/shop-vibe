import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Aggregate review stats for all products in one query
  const stats = await prisma.review.groupBy({
    by: ["productId"],
    where: { isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  // Build a map for quick lookup
  const statsMap = new Map(stats.map((s) => [s.productId, s]));

  const products = await prisma.product.findMany();

  // Prepare batch updates
  const updates = products.map((product) => {
    const s = statsMap.get(product.id);
    return prisma.product.update({
      where: { id: product.id },
      data: {
        averageRating: s?._avg.rating ?? 0,
        reviewCount: s?._count._all ?? 0,
      },
    });
  });

  await prisma.$transaction(updates);
  console.log(`Updated ${products.length} products`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
