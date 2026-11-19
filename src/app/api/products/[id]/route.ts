import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminWrite } from "@/lib/auth";
import { parseBody, productUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

const notFound = () =>
  NextResponse.json({ error: "Product not found", code: "NOT_FOUND" }, { status: 404 });

const isKnownError = (e: unknown, code: string) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === code;

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return notFound();

    return NextResponse.json(product, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    console.error("Failed to fetch product:", e);
    return NextResponse.json(
      { error: "Failed to fetch product", code: "INTERNAL" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireAdminWrite();
    if (auth.response) return auth.response;

    const { id } = await params;
    const parsed = await parseBody(request, productUpdateSchema);
    if (parsed.response) return parsed.response;

    const product = await prisma.product.update({ where: { id }, data: parsed.data });
    return NextResponse.json(product);
  } catch (e) {
    if (isKnownError(e, "P2025")) return notFound();
    console.error("Failed to update product:", e);
    return NextResponse.json(
      { error: "Failed to update product", code: "INTERNAL" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireAdminWrite();
    if (auth.response) return auth.response;

    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (isKnownError(e, "P2025")) return notFound();
    if (isKnownError(e, "P2003")) {
      // Order history references the product; it must stay for the records.
      return NextResponse.json(
        {
          error: "This product has been ordered and cannot be deleted. Set its stock to 0 instead.",
          code: "PRODUCT_IN_USE",
        },
        { status: 409 },
      );
    }
    console.error("Failed to delete product:", e);
    return NextResponse.json(
      { error: "Failed to delete product", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
