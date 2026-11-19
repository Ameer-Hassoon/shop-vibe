import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRateLimiter, getClientIpFromRequest } from "@/lib/rateLimit";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
// How long a signed-in user's role is trusted before it is re-read from the database.
const ROLE_REFRESH_MS = 5 * 60 * 1000;

const loginLimiter = createRateLimiter({
  name: "login",
  windowMs: LOGIN_WINDOW_MS,
  maxAttempts: MAX_LOGIN_ATTEMPTS,
});

export type SessionUser = {
  id: string;
  role: "USER" | "ADMIN";
  /** True for the public demo admin: can see the back office but not change anything. */
  readOnly?: boolean;
  email?: string | null;
  name?: string | null;
};

/**
 * The demo admin account (DEMO_ADMIN_EMAIL) is shared publicly so visitors can explore the
 * back office. It gets admin read access only; every admin write is refused.
 */
export function isReadOnlyAccount(email: string | null | undefined): boolean {
  const demo = process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase();
  return !!demo && !!email && email.trim().toLowerCase() === demo;
}

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

        if (await loginLimiter.isRateLimited(limiterKey)) {
          console.warn("Login rate limit exceeded for", limiterKey);
          throw new Error("RateLimited: too many login attempts");
        }

        const user = await prisma.user.findUnique({ where: { email } });
        const isPasswordValid = user
          ? await compare(credentials.password, user.password)
          : false;

        if (!user || !isPasswordValid) {
          await loginLimiter.increment(limiterKey);
          return null;
        }

        await loginLimiter.reset(limiterKey);
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
        token.refreshedAt = Date.now();
        return token;
      }
      // A JWT lives for 30 days, so re-check the account now and then: a demoted admin loses
      // admin access and a deleted account is signed out within ROLE_REFRESH_MS.
      if (token.id && Date.now() - (token.refreshedAt ?? 0) > ROLE_REFRESH_MS) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id },
            select: { role: true },
          });
          if (!fresh) {
            delete token.id;
            delete token.role;
          } else {
            token.role = fresh.role === "ADMIN" ? "ADMIN" : "USER";
            token.refreshedAt = Date.now();
          }
        } catch (err) {
          // Keep the current token on a transient database error; it is retried next request.
          console.error("Failed to refresh session user:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "USER";
        session.user.readOnly = isReadOnlyAccount(token.email);
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

/** Like `requireAdmin`, but also refuses the read-only demo admin. Use for every admin write. */
export async function requireAdminWrite(): Promise<AuthResult> {
  const auth = await requireAdmin();
  if (auth.response) return auth;
  if (auth.user.readOnly || isReadOnlyAccount(auth.user.email)) {
    return deny("This is a read-only demo account. Changes are disabled.", "DEMO_READ_ONLY", 403);
  }
  return auth;
}
