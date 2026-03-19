import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = ['Electronics', 'Computers & Laptops', 'Phones & Tablets', 'Cameras & Photography', 'TV & Home Entertainment', 'Audio & Headphones', 'Clothing', 'Shoes & Footwear', 'Jewelry & Watches', 'Bags & Backpacks', 'Home & Garden', 'Kitchen & Dining', 'Furniture', 'Lighting', 'Sports & Outdoors', 'Fitness Equipment', 'Cycling', 'Camping & Hiking', 'Books', 'Toys & Games', 'Beauty & Personal Care', 'Automotive', 'Pet Supplies', 'Office Supplies'];

const productNames = [
  'Wireless Headphones', 'Smart Watch', 'Running Shoes', 'Leather Backpack', 'Coffee Maker',
  'Bluetooth Speaker', 'Gaming Mouse', 'Mechanical Keyboard', 'Laptop Stand', 'Webcam HD',
  'T-Shirt', 'Jeans', 'Jacket', 'Sneakers', 'Hat', 'Sunglasses', 'Watch', 'Belt', 'Scarf', 'Gloves',
  'Plant Pot', 'Desk Lamp', 'Cushion', 'Throw Blanket', 'Candle', 'Picture Frame', 'Mirror', 'Rug', 'Vase', 'Clock',
  'Basketball', 'Football', 'Tennis Racket', 'Yoga Mat', 'Dumbbells', 'Bicycle', 'Skateboard', 'Swimming Goggles', 'Helmet', 'Water Bottle',
  'Novel', 'Textbook', 'Magazine', 'Comic Book', 'Cookbook', 'Biography', 'Self-Help Book', 'Poetry Collection', 'Art Book', 'Journal',
];

const descriptions = [
  'High-quality product with excellent features. Perfect for everyday use.',
  'Premium quality item that delivers outstanding performance. Built to last.',
  'Stylish and functional design. Great value for money.',
  'Top-rated product with amazing reviews. Customer favorite.',
  'Innovative design meets practical functionality. A must-have item.',
  'Durable construction with attention to detail. Perfect gift idea.',
  'Ergonomic design for maximum comfort. Suitable for all users.',
  'Modern aesthetics with classic appeal. Complements any style.',
  'Lightweight and portable. Ideal for travel and outdoor activities.',
  'Energy-efficient and eco-friendly. Great for the environment.',
];

const imageUrls = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
  'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500',
  'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500',
  'https://images.unsplash.com/photo-1491553895911-0055uj948-ad?w=500',
];

function getRandomElement(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPrice() {
  return Math.round((Math.random() * 990 + 10) * 100) / 100;
}

function getRandomStock() {
  return Math.floor(Math.random() * 100) + 5;
}

function getRandomDescription() {
  return Array(2).fill(null).map(() => getRandomElement(descriptions)).join(' ');
}

async function main() {
  console.log('Starting to seed 1000 products...');

  const batchSize = 50;
  const totalProducts = 1000;

  for (let i = 0; i < totalProducts; i += batchSize) {
    const products = [];
    
    for (let j = 0; j < batchSize && i + j < totalProducts; j++) {
      const nameVariant = Math.floor(Math.random() * 100);
      products.push({
        name: `${getRandomElement(productNames)} ${getRandomElement(['Pro', 'Plus', 'Elite', 'Max', 'Mini', 'Ultra', 'Basic', 'Premium'])} ${nameVariant}`,
        description: getRandomDescription(),
        price: getRandomPrice(),
        image: getRandomElement(imageUrls),
        category: getRandomElement(categories),
        stock: getRandomStock(),
      });
    }

    await prisma.product.createMany({
      data: products,
    });

    console.log(`Created ${Math.min(i + batchSize, totalProducts)} / ${totalProducts} products`);
  }

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
