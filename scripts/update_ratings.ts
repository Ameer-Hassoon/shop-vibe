import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  
  for (const product of products) {
    const stats = await prisma.review.aggregate({
      where: { productId: product.id, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });
    
    await prisma.product.update({
      where: { id: product.id },
      data: {
        averageRating: stats._avg.rating || 0,
        reviewCount: stats._count,
      },
    });
  }
  
  console.log(`Updated ${products.length} products`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
