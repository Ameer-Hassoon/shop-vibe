import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createInMemoryRateLimiter,
  getClientIpFromRequest,
} from "@/lib/rateLimit";

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_REQUESTS = 5;

const { isRateLimited, increment } = createInMemoryRateLimiter({
  windowMs: RATE_LIMIT_WINDOW,
  maxAttempts: MAX_REQUESTS,
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordMinLength = 8;

export async function POST(request: NextRequest) {
  const clientIP = getClientIpFromRequest(request);

  if (isRateLimited(clientIP)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      increment(clientIP);
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (typeof email !== "string" || !emailRegex.test(email)) {
      increment(clientIP);
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    if (typeof password !== "string" || password.length < passwordMinLength) {
      increment(clientIP);
      return NextResponse.json(
        { error: `Password must be at least ${passwordMinLength} characters` },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      increment(clientIP);
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
