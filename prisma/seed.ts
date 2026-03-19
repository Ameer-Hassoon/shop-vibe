import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shop.com' },
    update: {},
    create: {
      email: 'admin@shop.com',
      name: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Created admin:', admin.email);

  // Create sample products
  const products = [
    {
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
      price: 149.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      category: 'Electronics',
      stock: 50,
    },
    {
      name: 'Smart Watch',
      description: 'Feature-rich smartwatch with heart rate monitoring, GPS, and water resistance. Compatible with iOS and Android.',
      price: 299.99,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      category: 'Electronics',
      stock: 30,
    },
    {
      name: 'Running Shoes',
      description: 'Lightweight and breathable running shoes with superior cushioning. Ideal for daily runs and marathons.',
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      category: 'Sports',
      stock: 75,
    },
    {
      name: 'Leather Backpack',
      description: 'Premium leather backpack with multiple compartments. Perfect for work, travel, or everyday use.',
      price: 129.99,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
      category: 'Clothing',
      stock: 40,
    },
    {
      name: 'Coffee Maker',
      description: 'Programmable coffee maker with thermal carafe. Brews delicious coffee in minutes.',
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500',
      category: 'Home & Garden',
      stock: 25,
    },
    {
      name: 'Bluetooth Speaker',
      description: 'Portable Bluetooth speaker with 360-degree sound and 20-hour battery. Waterproof design.',
      price: 59.99,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
      category: 'Electronics',
      stock: 60,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log(`Created ${products.length} products`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
