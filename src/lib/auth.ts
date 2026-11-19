import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createInMemoryRateLimiter,
  getClientIpFromRequest,
} from "@/lib/rateLimit";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;

const loginLimiter = createInMemoryRateLimiter({
  windowMs: LOGIN_WINDOW_MS,
  maxAttempts: MAX_LOGIN_ATTEMPTS,
});

export type SessionUser = {
  id: string;
  role: "USER" | "ADMIN";
  email?: string | null;
  name?: string | null;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string" ||
          !credentials.email ||
          !credentials.password
        ) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        // Keyed by IP *and* account so that, when no trustworthy client IP is available
        // (shared bucket), one attacker cannot lock every user out of logging in.
        const limiterKey = `${getClientIpFromRequest(req as unknown as Request)}|${email}`;

        if (loginLimiter.isRateLimited(limiterKey)) {
          console.warn("Login rate limit exceeded for", limiterKey);
          throw new Error("RateLimited: too many login attempts");
        }

        const user = await prisma.user.findUnique({ where: { email } });
        const isPasswordValid = user
          ? await compare(credentials.password, user.password)
          : false;

        if (!user || !isPasswordValid) {
          loginLimiter.increment(limiterKey);
          return null;
        }

        loginLimiter.reset(limiterKey);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role === "ADMIN" ? "ADMIN" : "USER",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "USER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/en/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/** The signed-in user, or null for anonymous visitors. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session.user;
}

export type AuthResult =
  | { user: SessionUser; response: null }
  | { user: null; response: NextResponse };

const deny = (error: string, code: string, status: number): AuthResult => ({
  user: null,
  response: NextResponse.json({ error, code }, { status }),
});

/**
 * Usage: `const auth = await requireUser(); if (auth.response) return auth.response;`
 * Returns the user, or a ready 401 response.
 */
export async function requireUser(): Promise<AuthResult> {
  const user = await getSessionUser();
  if (!user) return deny("Unauthorized", "UNAUTHORIZED", 401);
  return { user, response: null };
}

/** Like `requireUser`, plus 403 when the user is not an admin. */
export async function requireAdmin(): Promise<AuthResult> {
  const user = await getSessionUser();
  if (!user) return deny("Unauthorized", "UNAUTHORIZED", 401);
  if (user.role !== "ADMIN") return deny("Forbidden", "FORBIDDEN", 403);
  return { user, response: null };
}
