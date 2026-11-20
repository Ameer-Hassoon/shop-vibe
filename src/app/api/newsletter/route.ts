import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRateLimiter, getClientIpFromRequest } from "@/lib/rateLimit";
import { newsletterSchema, parseBody } from "@/lib/validation";

// Public and unauthenticated, so cap how fast one client can sign addresses up or out.
const limiter = createRateLimiter({
  name: "newsletter",
  windowMs: 15 * 60 * 1000,
  maxAttempts: 10,
});

const rateLimited = () =>
  NextResponse.json(
    { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
    { status: 429 },
  );

/** Counts one attempt for the caller; returns a 429 response once the limit is used up. */
async function checkLimit(request: NextRequest) {
  const ip = getClientIpFromRequest(request);
  if (await limiter.isRateLimited(ip)) return rateLimited();
  await limiter.increment(ip);
  return null;
}

const internal = (error: string) =>
  NextResponse.json({ error, code: "INTERNAL" }, { status: 500 });

export async function POST(request: NextRequest) {
  try {
    const limited = await checkLimit(request);
    if (limited) return limited;

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
    const limited = await checkLimit(request);
    if (limited) return limited;

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
