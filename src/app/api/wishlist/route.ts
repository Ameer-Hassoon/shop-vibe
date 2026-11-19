import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseBody, productIdSchema } from "@/lib/validation";

const productSelect = {
  id: true,
  name: true,
  price: true,
  image: true,
  category: true,
  stock: true,
} as const;

const internal = (error: string) =>
  NextResponse.json({ error, code: "INTERNAL" }, { status: 500 });

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: auth.user.id },
      include: { product: { select: productSelect } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(wishlistItems, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return internal("Failed to get wishlist");
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    const parsed = await parseBody(request, productIdSchema);
    if (parsed.response) return parsed.response;
    const { productId } = parsed.data;

    if (!(await prisma.product.findUnique({ where: { id: productId }, select: { id: true } }))) {
      return NextResponse.json({ error: "Product not found", code: "NOT_FOUND" }, { status: 404 });
    }

    try {
      const wishlistItem = await prisma.wishlistItem.create({
        data: { userId, productId },
        include: { product: { select: productSelect } },
      });
      return NextResponse.json(wishlistItem);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json(
          { error: "Product already in wishlist", code: "ALREADY_EXISTS" },
          { status: 409 },
        );
      }
      throw e;
    }
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return internal("Failed to add to wishlist");
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const parsed = await parseBody(request, productIdSchema);
    if (parsed.response) return parsed.response;

    const result = await prisma.wishlistItem.deleteMany({
      where: { userId: auth.user.id, productId: parsed.data.productId },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return internal("Failed to remove from wishlist");
  }
}
