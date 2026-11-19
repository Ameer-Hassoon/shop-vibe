import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseBody, productCreateSchema } from "@/lib/validation";

const ITEMS_PER_PAGE = 20;
const MAX_LIMIT = 100;
const MAX_IDS = 100;
const MAX_SEARCH_LENGTH = 100;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().slice(0, MAX_SEARCH_LENGTH);
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
    const limit = Math.min(parsedLimit, MAX_LIMIT);
    const page = parsedPage;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, MAX_IDS);
      if (ids.length > 0) {
        where.id = { in: ids };
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category) {
      const categories = category
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      if (categories.length > 0) {
        where.category = categories.length === 1 ? categories[0] : { in: categories };
      }
    }

    const inStockOnly = searchParams.get("inStock") === "true";
    if (inStockOnly) {
      where.stock = { gt: 0 };
    }

    if (minPriceParam !== 0 || maxPriceParam !== 0) {
      if (!Number.isFinite(minPriceParam) || !Number.isFinite(maxPriceParam)) {
        return NextResponse.json(
          { error: "Invalid price values: must be finite numbers" },
          { status: 400 },
        );
      }
      if (minPriceParam < 0 || maxPriceParam < 0) {
        return NextResponse.json(
          { error: "Invalid price values: cannot be negative" },
          { status: 400 },
        );
      }
      if (minPriceParam !== 0 && maxPriceParam !== 0 && minPriceParam > maxPriceParam) {
        return NextResponse.json(
          { error: "Invalid price range: minPrice cannot be greater than maxPrice" },
          { status: 400 },
        );
      }
      where.price = {};
      if (minPriceParam !== 0) {
        (where.price as Record<string, number>).gte = minPriceParam;
      }
      if (maxPriceParam !== 0) {
        (where.price as Record<string, number>).lte = maxPriceParam;
      }
    }
    if (minRatingParam !== 0) {
      if (Number.isNaN(minRatingParam) || !Number.isFinite(minRatingParam)) {
        return NextResponse.json(
          { error: "Invalid rating value: must be a number" },
          { status: 400 },
        );
      }
      if (minRatingParam < 0 || minRatingParam > 5) {
        return NextResponse.json(
          { error: "Invalid rating range: minRating must be between 0 and 5" },
          { status: 400 },
        );
      }
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
          // Cart/wishlist lookups by id need fresh stock; browsing can be cached briefly.
          "Cache-Control": idsParam
            ? "private, no-store"
            : "public, s-maxage=60, stale-while-revalidate=120",
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
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const parsed = await parseBody(request, productCreateSchema);
    if (parsed.response) return parsed.response;

    const product = await prisma.product.create({ data: parsed.data });

    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    console.error("Failed to create product:", e);
    return NextResponse.json(
      { error: "Failed to create product", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
