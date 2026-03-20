import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (!existing.isActive) {
        await prisma.newsletterSubscriber.update({
          where: { email: normalizedEmail },
          data: { isActive: true, subscribedAt: new Date() },
        });
        return NextResponse.json({ message: "Successfully subscribed" });
      }
      return NextResponse.json({ message: "Already subscribed" });
    }

    await prisma.newsletterSubscriber.create({
      data: { email: normalizedEmail },
    });

    return NextResponse.json(
      { message: "Successfully subscribed" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 },
      );
    }

    await prisma.newsletterSubscriber.update({
      where: { email: normalizedEmail },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Successfully unsubscribed" });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 },
    );
  }
}
