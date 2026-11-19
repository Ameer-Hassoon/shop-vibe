"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { buttonClass, EmptyState } from "@/components/ui";
import { IconBox, IconGrid, IconLock, IconReceipt, IconStore } from "./icons";
import { Skeleton } from "./AdminUI";

const NAV = [
  { href: "/admin", key: "navOverview", Icon: IconGrid, match: (p: string) => p === "/admin" },
  {
    href: "/admin/products",
    key: "navProducts",
    Icon: IconBox,
    match: (p: string) => /^\/admin\/(products|create|edit)/.test(p),
  },
  { href: "/admin/orders", key: "navOrders", Icon: IconReceipt, match: (p: string) => p.startsWith("/admin/orders") },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const readOnly = !!session?.user?.readOnly;

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (role !== "ADMIN") {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          className="py-24"
          icon={<IconLock />}
          title={t("notAuthorizedTitle")}
          description={t("notAuthorizedDesc")}
          action={
            <Link href="/login" className={buttonClass("primary", "md")}>
              {t("signIn")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-8 lg:py-10">
      <aside className="shrink-0 lg:w-56">
        <nav
          aria-label={t("navLabel")}
          className="scrollbar-thin -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 pb-3 sm:-mx-6 sm:px-6 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:overflow-visible lg:border-b-0 lg:px-0 lg:pb-0"
        >
          <p className="hidden px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-subtle lg:block">
            {t("backOffice")}
          </p>
          {NAV.map(({ href, key, Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[var(--radius-control)] px-3 text-sm font-medium transition-colors",
                  active ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon />
                {t(key)}
              </Link>
            );
          })}
          <span aria-hidden className="hidden lg:my-2 lg:block lg:border-t lg:border-line" />
          <Link
            href="/"
            className="flex h-10 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[var(--radius-control)] px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <IconStore />
            {t("backToStore")}
          </Link>
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        {readOnly && (
          <div role="status" className="mb-5 rounded-[var(--radius-control)] bg-brand-soft px-4 py-3 text-sm text-brand">
            <p className="font-semibold">{t("readOnlyTitle")}</p>
            <p className="mt-0.5">{t("readOnlyDesc")}</p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
