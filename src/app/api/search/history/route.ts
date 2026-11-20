import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const history = await prisma.searchHistory.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      // Prisma applies `take` before `distinct`, so read the whole (50-row capped) history
      // and trim afterwards; otherwise repeated searches would leave fewer than 10 entries.
      take: 50,
      distinct: ["query"],
    });

    return NextResponse.json(history.slice(0, 10), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Get search history error:", error);
    return NextResponse.json(
      { error: "Failed to get search history", code: "INTERNAL" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    await prisma.searchHistory.deleteMany({ where: { userId: auth.user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear search history error:", error);
    return NextResponse.json(
      { error: "Failed to clear search history", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
