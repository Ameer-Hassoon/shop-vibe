"use client";

import { useLocale, useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Badge, Button, Card } from "@/components/ui";
import { useRequireAuth } from "@/components/account/authRedirect";
import { useFetchJson } from "@/components/account/useFetchJson";
import { ChevronIcon, HeartIcon, PackageIcon, StarIcon } from "@/components/account/icons";
import { useWishlistStore } from "@/store/wishlist";
import type { OrderDto } from "@/components/checkout/orderTypes";

const shell = "mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const locale = useLocale();
  const auth = useRequireAuth("/profile");
  const { data: session } = useSession();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { state } = useFetchJson<OrderDto[]>(auth === "authenticated" ? "/api/orders" : null);

  const title = <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">{t("myProfile")}</h1>;

  if (auth !== "authenticated" || !session?.user) {
    return (
      <div className={shell} aria-busy="true">
        {title}
        <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
      </div>
    );
  }

  const user = session.user as { name?: string | null; email?: string | null; role?: string };
  const display = user.name || user.email || "";
  const initial = display.trim().charAt(0).toUpperCase();
  const orderCount = state.status === "ok" && Array.isArray(state.data) ? state.data.length : null;

  const links = [
    { href: "/orders", icon: <PackageIcon />, label: t("myOrders"), meta: orderCount !== null ? t("ordersCount", { count: orderCount }) : "" },
    { href: "/wishlist", icon: <HeartIcon />, label: tc("wishlist"), meta: t("savedCount", { count: wishlistCount }) },
    { href: "/reviews", icon: <StarIcon />, label: t("myReviews"), meta: "" },
  ];

  return (
    <div className={shell}>
      {title}
      <Card className="mb-6 p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-soft text-2xl font-bold text-brand"
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">{display}</h2>
            {user.name && user.email && <p className="truncate text-sm text-muted" dir="ltr">{user.email}</p>}
            {user.role === "ADMIN" && <Badge tone="accent" className="mt-1.5">{t("roleAdmin")}</Badge>}
          </div>
        </div>
        <dl className="mt-5 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">{t("name")}</dt>
            <dd className="font-medium">{user.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("email")}</dt>
            <dd className="font-medium" dir="ltr">{user.email}</dd>
          </div>
        </dl>
      </Card>

      <ul className="mb-6 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-line-strong"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-brand">{l.icon}</span>
              <span className="flex-1 font-semibold">{l.label}</span>
              {l.meta && <span className="text-sm text-muted">{l.meta}</span>}
              <ChevronIcon className="h-5 w-5 text-subtle rtl:-scale-x-100" />
            </Link>
          </li>
        ))}
      </ul>

      <Button variant="outline" onClick={() => signOut({ callbackUrl: `/${locale}` })}>
        {tc("logout")}
      </Button>
    </div>
  );
}
