"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Input } from "@/components/ui";
import { CheckIcon, AlertIcon } from "./icons";

type Status = { kind: "idle" } | { kind: "success"; already: boolean } | { kind: "error"; message: string };

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus({ kind: "error", message: t("footer.invalidEmail") });
      return;
    }
    setLoading(true);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("failed");
      setStatus({ kind: "success", already: data?.message === "Already subscribed" });
      setEmail("");
    } catch {
      setStatus({ kind: "error", message: t("footer.subscribeError") });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: t("footer.shop"),
      links: [
        { href: "/", label: t("footer.allProducts") },
        { href: "/wishlist", label: t("common.wishlist") },
        { href: "/cart", label: t("common.cart") },
      ],
    },
    {
      title: t("footer.account"),
      links: [
        { href: "/profile", label: t("navbar.myProfile") },
        { href: "/orders", label: t("navbar.orderHistory") },
        { href: "/reviews", label: t("navbar.myReviews") },
      ],
    },
  ];

  const linkClass = "text-sm text-muted transition-colors hover:text-fg";

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1.4fr] lg:gap-12">
          <div className="max-w-sm">
            <Link href="/" locale={locale} className="text-2xl font-extrabold tracking-tight text-brand">
              {t("navbar.brand")}
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t("footer.blurb")}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:contents">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="text-sm font-semibold">{col.title}</h2>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} locale={locale} className={linkClass}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  {col === columns[1] && (
                    <li>
                      <a href="mailto:hello@souq.example" className={linkClass}>
                        {t("footer.contactUs")}
                      </a>
                    </li>
                  )}
                </ul>
              </nav>
            ))}
          </div>

          <div>
            <h2 className="text-sm font-semibold">{t("footer.newsletter")}</h2>
            <p className="mt-4 text-sm text-muted">{t("footer.newsletterBlurb")}</p>
            <form onSubmit={subscribe} noValidate className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                dir="ltr"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("footer.emailPlaceholder")}
                aria-label={t("footer.emailPlaceholder")}
                aria-invalid={status.kind === "error" || undefined}
                className="min-w-0 flex-1 text-start placeholder:text-start"
              />
              <Button type="submit" loading={loading} className="sm:shrink-0">
                {t("footer.subscribe")}
              </Button>
            </form>
            <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm">
              {status.kind === "success" && (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <CheckIcon className="h-4 w-4" />
                  {status.already ? t("footer.alreadySubscribed") : t("footer.subscribed")}
                </span>
              )}
              {status.kind === "error" && (
                <span className="inline-flex items-center gap-1.5 text-danger">
                  <AlertIcon className="h-4 w-4" />
                  {status.message}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-sm text-subtle">
          &copy; {new Date().getFullYear()} {t("navbar.brand")}. {t("footer.copyright")}.
        </div>
      </div>
    </footer>
  );
}
