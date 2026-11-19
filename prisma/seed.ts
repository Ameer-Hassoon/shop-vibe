/**
 * Idempotent demo seed: safe to run any number of times.
 *   - admin user (created once; an existing password is never overwritten)
 *   - three coupons (validity window refreshed to one year from now)
 *   - demo products with stable ids (text is refreshed, stock is left alone on re-runs)
 * Product categories must be keys of CATEGORY_DISPLAY_TO_KEY in src/lib/categoryTranslations.ts.
 */
import crypto from "crypto";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const img = (photoId: string) => `https://images.unsplash.com/photo-${photoId}?w=800&q=80`;

const products = [
  {
    slug: "wireless-headphones",
    name: "Wireless Over-Ear Headphones",
    description:
      "Comfortable over-ear headphones with active noise cancellation and a 30-hour battery. Folds flat for travel.",
    price: 149.99,
    image: img("1505740420928-5e560c06d30e"),
    category: "Audio & Headphones",
    stock: 50,
  },
  {
    slug: "minimal-smartwatch",
    name: "Minimal Smartwatch",
    description:
      "A clean round-face smartwatch with heart-rate tracking, GPS and a silicone strap. Water resistant to 50 m.",
    price: 199.99,
    image: img("1523275335684-37898b6baf30"),
    category: "Jewelry & Watches",
    stock: 30,
  },
  {
    slug: "ultrabook-13",
    name: "Ultrabook 13-inch Laptop",
    description:
      "Thin and light 13-inch laptop with a sharp display, 16 GB RAM, 512 GB SSD and all-day battery life.",
    price: 1099,
    image: img("1496181133206-80ce9b88a853"),
    category: "Computers & Laptops",
    stock: 15,
  },
  {
    slug: "smartphone-128",
    name: "Smartphone 128 GB",
    description:
      "Edge-to-edge OLED screen, dual cameras and fast charging. Unlocked and ready for any network.",
    price: 699,
    image: img("1511707171634-5f897ff02aa9"),
    category: "Phones & Tablets",
    stock: 25,
  },
  {
    slug: "instant-camera",
    name: "Instant Film Camera",
    description:
      "Point, shoot and watch the print develop. Built-in flash and a rechargeable battery; film sold separately.",
    price: 129.99,
    image: img("1526170375885-4d8ecf77b99f"),
    category: "Cameras & Photography",
    stock: 20,
  },
  {
    slug: "smart-tv-55",
    name: '55" 4K Smart TV',
    description:
      "Bright 4K display with HDR, built-in streaming apps and three HDMI ports. Wall-mount ready.",
    price: 549,
    image: img("1593359677879-a4bb92f829d1"),
    category: "TV & Home Entertainment",
    stock: 8,
  },
  {
    slug: "cotton-tee",
    name: "Classic Cotton T-Shirt",
    description:
      "Heavyweight 100% organic cotton tee with a relaxed fit. Pre-washed so it keeps its shape.",
    price: 24.99,
    image: img("1521572163474-6864f9cf17ab"),
    category: "Clothing",
    stock: 120,
  },
  {
    slug: "sunglasses",
    name: "Classic Sunglasses",
    description:
      "Timeless acetate frames with UV400 polarised lenses. Includes a hard case and cleaning cloth.",
    price: 79,
    image: img("1572635196237-14b3f281503f"),
    category: "Clothing",
    stock: 60,
  },
  {
    slug: "suede-shoes",
    name: "Suede Low-Top Shoes",
    description:
      "Hand-finished suede upper on a flexible rubber sole. Dresses up or down with equal ease.",
    price: 119,
    image: img("1560343090-f0409e92791a"),
    category: "Shoes & Footwear",
    stock: 40,
  },
  {
    slug: "running-sneakers",
    name: "Lightweight Running Sneakers",
    description:
      "Breathable knit upper with responsive cushioning, built for daily runs and race days alike.",
    price: 89.99,
    image: img("1491553895911-0055eca6402d"),
    category: "Shoes & Footwear",
    stock: 75,
  },
  {
    slug: "everyday-backpack",
    name: "Everyday Backpack",
    description:
      "Water-repellent 22 L backpack with a padded laptop sleeve and hidden back pocket for your passport.",
    price: 59.99,
    image: img("1553062407-98eeb64c6a62"),
    category: "Bags & Backpacks",
    stock: 45,
  },
  {
    slug: "top-handle-bag",
    name: "Leather Top-Handle Bag",
    description:
      "Structured full-grain leather bag with a polished clasp and a detachable shoulder strap.",
    price: 179,
    image: img("1584917865442-de89df76afd3"),
    category: "Bags & Backpacks",
    stock: 12,
  },
  {
    slug: "latte-cup-set",
    name: "Ceramic Latte Cup Set",
    description:
      "Set of four hand-glazed ceramic cups, 250 ml each. Dishwasher and microwave safe.",
    price: 34.5,
    image: img("1495474472287-4d71bcdd2085"),
    category: "Kitchen & Dining",
    stock: 80,
  },
  {
    slug: "velvet-sofa",
    name: "Velvet Three-Seater Sofa",
    description:
      "Deep-seat sofa in emerald velvet with solid-wood legs. Removable cushion covers, easy assembly.",
    price: 799,
    image: img("1555041469-a586c61ea9bc"),
    category: "Furniture",
    stock: 5,
  },
  {
    slug: "floor-lamp",
    name: "Matte Floor Lamp",
    description:
      "Adjustable matte-grey floor lamp with a warm, dimmable glow. Bulb included.",
    price: 69,
    image: img("1507473885765-e6ed057f782c"),
    category: "Lighting",
    stock: 35,
  },
  {
    slug: "pendant-lamp",
    name: "Pendant Lamp",
    description:
      "Simple dome pendant with a 2 m cable and ceiling canopy. Works with any standard E27 bulb.",
    price: 45,
    image: img("1513506003901-1e6a229e2d15"),
    category: "Lighting",
    stock: 28,
  },
  {
    slug: "barbell-set",
    name: "Barbell and Plate Set",
    description:
      "Olympic-style barbell with 80 kg of rubber-coated plates and spring collars for home gyms.",
    price: 189,
    image: img("1517836357463-d25dfeac3438"),
    category: "Fitness & Gym",
    stock: 10,
  },
  {
    slug: "city-bike",
    name: "Steel City Bike",
    description:
      "Lightweight steel-frame single-speed bike with a comfortable saddle. Perfect for commuting.",
    price: 449,
    image: img("1485965120184-e220f721d03e"),
    category: "Cycling",
    stock: 9,
  },
  {
    slug: "camping-tent",
    name: "Two-Person Camping Tent",
    description:
      "Quick-pitch, fully waterproof dome tent with a vestibule for gear. Packs down to 45 cm.",
    price: 129,
    image: img("1504280390367-361c6d9f38f4"),
    category: "Camping & Hiking",
    stock: 22,
  },
  {
    slug: "poetry-paperback",
    name: "Modern Poetry Paperback",
    description:
      "A bestselling collection of short, honest poems about love, loss and healing.",
    price: 14.99,
    image: img("1544947950-fa07a98d237f"),
    category: "Books & Media",
    stock: 150,
  },
  {
    slug: "wooden-train-set",
    name: "Wooden Toy Train Set",
    description:
      "Painted beech-wood train set with track, station and trees. Safe, non-toxic finish. Ages 3+.",
    price: 39.99,
    image: img("1596461404969-9ae70f2830c1"),
    category: "Toys & Games",
    stock: 55,
  },
  {
    slug: "face-cleanser",
    name: "Gentle Face Cleanser",
    description:
      "Fragrance-free daily cleanser for all skin types. Removes impurities without stripping moisture.",
    price: 18.99,
    image: img("1556228720-195a672e8a03"),
    category: "Health & Beauty",
    stock: 100,
  },
];

const LEGACY_PRODUCT_NAMES = [
  "Wireless Headphones",
  "Smart Watch",
  "Running Shoes",
  "Leather Backpack",
  "Coffee Maker",
  "Bluetooth Speaker",
];

async function seedAdmin() {
  const email = "admin@shop.com";
  if (await prisma.user.findUnique({ where: { email } })) {
    console.log("Admin exists:", email);
    return;
  }
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString("hex");
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(`ADMIN_PASSWORD not set; generated admin password: ${password}`);
  }
  await prisma.user.create({
    data: { email, name: "Admin", password: await hash(password, 10), role: "ADMIN" },
  });
  console.log("Created admin:", email);
}

async function seedCoupons() {
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const coupons = [
    { code: "WELCOME10", type: "PERCENTAGE", value: 10, minPurchase: 0, maxDiscount: 50, freeShipping: false },
    { code: "SAVE20", type: "FIXED", value: 20, minPurchase: 100, maxDiscount: null, freeShipping: false },
    { code: "FREESHIP", type: "FIXED", value: 0, minPurchase: 0, maxDiscount: null, freeShipping: true },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      // usageCount is kept so re-seeding never resets real usage
      update: { ...c, validFrom: now, validUntil, isActive: true },
      create: { ...c, validFrom: now, validUntil },
    });
  }
  console.log(`Upserted ${coupons.length} coupons`);
}

async function seedProducts() {
  const removed = await prisma.product.deleteMany({
    where: { name: { in: LEGACY_PRODUCT_NAMES }, id: { not: { startsWith: "seed-" } }, orderItems: { none: {} } },
  });
  if (removed.count) console.log(`Removed ${removed.count} legacy demo products`);

  for (const { slug, stock, ...fields } of products) {
    const id = `seed-${slug}`;
    await prisma.product.upsert({
      where: { id },
      update: fields, // stock intentionally untouched
      create: { id, stock, ...fields },
    });
  }
  console.log(`Upserted ${products.length} products`);
}

async function backfillOrders() {
  // Orders created before the price breakdown existed stored only a subtotal in `total`.
  const legacy = await prisma.$executeRaw`UPDATE "Order" SET subtotal = total WHERE subtotal = 0 AND total > 0`;
  if (legacy) console.log(`Backfilled subtotal on ${legacy} legacy orders`);
}

async function main() {
  console.log("Seeding database...");
  await seedAdmin();
  await seedCoupons();
  await seedProducts();
  await backfillOrders();
  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
