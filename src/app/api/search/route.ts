import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseBody, searchHistorySchema } from "@/lib/validation";

const MAX_HISTORY_PER_USER = 50;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get("q") || "").trim().slice(0, 100);
    const rawLimit = parseInt(searchParams.get("limit") || "10", 10);
    const limit = Number.isNaN(rawLimit)
      ? 10
      : Math.min(Math.max(1, rawLimit), 20);
    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { category: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        category: true,
        stock: true,
      },
      take: limit,
      orderBy: [{ name: "asc" }],
    });

    const suggestions = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      category: p.category,
      inStock: p.stock > 0,
    }));

    return NextResponse.json(suggestions, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const parsed = await parseBody(request, searchHistorySchema);
    if (parsed.response) return parsed.response;

    const userId = auth.user.id;
    const history = await prisma.searchHistory.create({
      data: { userId, query: parsed.data.query },
    });

    // Only the latest entries are ever shown, so keep the table from growing without bound.
    const stale = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: MAX_HISTORY_PER_USER,
      select: { id: true },
    });
    if (stale.length > 0) {
      await prisma.searchHistory.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error("Save search error:", error);
    return NextResponse.json(
      { error: "Failed to save search", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
