import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { newsletterSchema, parseBody } from "@/lib/validation";

const internal = (error: string) =>
  NextResponse.json({ error, code: "INTERNAL" }, { status: 500 });

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, newsletterSchema);
    if (parsed.response) return parsed.response;
    const { email } = parsed.data;

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });

    if (existing) {
      if (!existing.isActive) {
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { isActive: true, subscribedAt: new Date() },
        });
        return NextResponse.json({ message: "Successfully subscribed" });
      }
      return NextResponse.json({ message: "Already subscribed" });
    }

    // upsert keeps two concurrent sign-ups from failing on the unique email
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email },
      update: {},
    });

    return NextResponse.json({ message: "Successfully subscribed" }, { status: 201 });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return internal("Failed to subscribe");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const parsed = await parseBody(request, newsletterSchema);
    if (parsed.response) return parsed.response;
    const { email } = parsed.data;

    // Same answer whether or not the address was subscribed, so this endpoint cannot be
    // used to find out who is on the list.
    await prisma.newsletterSubscriber.updateMany({
      where: { email },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Successfully unsubscribed" });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return internal("Failed to unsubscribe");
  }
}
