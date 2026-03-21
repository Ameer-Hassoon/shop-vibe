import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ITEMS_PER_PAGE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const minPriceParam = parseFloat(searchParams.get("minPrice") || "0");
    const maxPriceParam = parseFloat(searchParams.get("maxPrice") || "0");
    const minRatingParam = parseFloat(searchParams.get("minRating") || "0");
    let parsedPage = parseInt(searchParams.get("page") || "1");
    let parsedLimit = parseInt(
      searchParams.get("limit") || ITEMS_PER_PAGE.toString(),
    );
    if (Number.isNaN(parsedPage) || parsedPage < 1) parsedPage = 1;
    if (Number.isNaN(parsedLimit) || parsedLimit < 1)
      parsedLimit = ITEMS_PER_PAGE;
    const limit = Math.min(parsedLimit, 1000);
    const page = parsedPage;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category) {
      const categories = category.split(",").map((c) => c.trim());
      where.category =
        categories.length === 1 ? categories[0] : { in: categories };
    }

    const inStockOnly = searchParams.get("inStock") === "true";
    if (inStockOnly) {
      where.stock = { gt: 0 };
    }

    if (minPriceParam > 0) {
      where.price = { ...(where.price as object || {}), gte: minPriceParam };
    }
    if (maxPriceParam > 0) {
      where.price = { ...(where.price as object || {}), lte: maxPriceParam };
    }
    if (minRatingParam > 0) {
      where.averageRating = { gte: minRatingParam };
    }

    const sortBy = searchParams.get("sortBy") || "newest";
    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sortBy === "price-low") orderBy = { price: "asc" };
    else if (sortBy === "price-high") orderBy = { price: "desc" };
    else if (sortBy === "name") orderBy = { name: "asc" };
    else if (sortBy === "rating") orderBy = { averageRating: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json(
      {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, image, category, stock } = body;

    if (
      !name ||
      !description ||
      price === undefined ||
      !image ||
      !category ||
      stock === undefined
    ) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 },
      );
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock);
    if (
      isNaN(parsedPrice) ||
      isNaN(parsedStock) ||
      parsedPrice < 0 ||
      parsedStock < 0
    ) {
      return NextResponse.json(
        { error: "Invalid price or stock value" },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parsedPrice,
        image,
        category,
        stock: parsedStock,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    console.error("Failed to create product:", e);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
