import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createInMemoryRateLimiter, getClientIpFromRequest } from "@/lib/rateLimit";
import { parseBody, registerSchema } from "@/lib/validation";

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_REQUESTS = 10;

const limiter = createInMemoryRateLimiter({
  windowMs: RATE_LIMIT_WINDOW,
  maxAttempts: MAX_REQUESTS,
});

const emailTaken = () =>
  NextResponse.json({ error: "User already exists", code: "EMAIL_TAKEN" }, { status: 409 });

export async function POST(request: NextRequest) {
  const clientIP = getClientIpFromRequest(request);

  // Every attempt counts (not only failures), otherwise accounts could be mass-created.
  if (limiter.isRateLimited(clientIP)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
      { status: 429 },
    );
  }
  limiter.increment(clientIP);

  try {
    const parsed = await parseBody(request, registerSchema);
    if (parsed.response) return parsed.response;
    const { name, email, password } = parsed.data;

    if (await prisma.user.findUnique({ where: { email } })) return emailTaken();

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: await hash(password, 10),
        role: "USER",
      },
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return emailTaken();
    }
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
