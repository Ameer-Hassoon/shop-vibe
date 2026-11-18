import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Souq — Online Store",
    template: "%s · Souq",
  },
  description:
    "A bilingual (English / Arabic) e-commerce store built with Next.js, TypeScript, Prisma and NextAuth.",
};

// <html> and <body> are rendered by app/[locale]/layout.tsx so they can carry lang/dir.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
