import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      /** Public demo admin: may view the back office but not change anything. */
      readOnly?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "USER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "USER" | "ADMIN";
    /** When `role` was last read from the database (ms since epoch). */
    refreshedAt?: number;
  }
}
