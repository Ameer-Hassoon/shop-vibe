"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useSearchHistory } from "@/store/searchHistory";
import { useTheme } from "@/store/theme";
import { Product } from "@/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui";
import LanguageSwitcher from "./LanguageSwitcher";
import { Sheet } from "./Sheet";
import { useCategoryLabel } from "./categoryLabel";
import {
  CartIcon,
  ChevronDownIcon,
  ChevronEndIcon,
  ClockIcon,
  HeartIcon,
  LogoutIcon,
  MenuIcon,
  MoonIcon,
  PackageIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  SunIcon,
  UserIcon,
} from "./icons";

const iconBtn =
  "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-fg transition-colors hover:bg-surface-2";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold leading-none text-brand-fg tabular">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("navbar");
  const toggleTheme = useTheme((s) => s.toggleTheme);
  // Both icons are always rendered and swapped with CSS, so there is no hydration mismatch.
  return (
    <button type="button" onClick={toggleTheme} aria-label={t("toggleTheme")} className={cn(iconBtn, className)}>
      <MoonIcon className="h-5 w-5 dark:hidden" />
      <SunIcon className="hidden h-5 w-5 dark:block" />
    </button>
  );
}

function SuggestionThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
      {!failed && (
        <Image src={src} alt="" fill sizes="48px" className="object-cover" onError={() => setFailed(true)} />
      )}
    </span>
  );
}

export default function Navbar() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const categoryLabel = useCategoryLabel();
  const { searches, addSearch, clearHistory } = useSearchHistory();

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const user = session?.user as { name?: string | null; email?: string | null; role?: string } | undefined;
  const isAdmin = user?.role === "ADMIN";
  const displayName = user?.name || user?.email?.split("@")[0] || t("common.user");

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setShowSuggestions(false);
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setShowUserMenu(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowSuggestions(false);
      setShowUserMenu((open) => {
        if (open) userButtonRef.current?.focus();
        return false;
      });
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const query = search.trim();
    if (query.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=6`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const products: Product[] = Array.isArray(data) ? data : data.products || [];
        setSuggestions(products.slice(0, 6));
        setShowSuggestions(true);
      } catch {
        /* aborted or offline: keep the previous suggestions */
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const runSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    addSearch(trimmed);
    setSearch(trimmed);
    setShowSuggestions(false);
    setDrawerOpen(false);
    router.push(`/?search=${encodeURIComponent(trimmed)}`, { locale });
  };

  const goToProduct = (id: string) => {
    setSearch("");
    setShowSuggestions(false);
    router.push(`/product/${id}`, { locale });
  };

  const trimmed = search.trim();
  const showHistory = mounted && showSuggestions && trimmed.length === 0 && searches.length > 0;
  const showResults = mounted && showSuggestions && trimmed.length >= 2;

  const menuItem =
    "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-fg transition-colors hover:bg-surface-2";

  const accountLinks = [
    { href: "/profile", label: t("navbar.myProfile"), icon: <UserIcon className="h-[18px] w-[18px] text-muted" /> },
    { href: "/orders", label: t("navbar.orderHistory"), icon: <PackageIcon className="h-[18px] w-[18px] text-muted" /> },
    { href: "/reviews", label: t("navbar.myReviews"), icon: <StarIcon className="h-[18px] w-[18px] text-muted" /> },
    ...(isAdmin
      ? [{ href: "/admin", label: t("navbar.adminPanel"), icon: <ShieldIcon className="h-[18px] w-[18px] text-muted" /> }]
      : []),
  ];

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6 md:h-16 md:flex-nowrap md:gap-x-4 md:py-0 lg:px-8">
        <Link
          href="/"
          locale={locale}
          onClick={() => setSearch("")}
          className="me-1 text-2xl font-extrabold leading-none tracking-tight text-brand"
        >
          {t("navbar.brand")}
        </Link>

        {/* Search: second row on mobile (order-last), centered on desktop */}
        <div ref={searchRef} className="relative order-last w-full md:order-none md:mx-auto md:max-w-xl md:flex-1">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(search);
            }}
          >
            <SearchIcon className="pointer-events-none absolute start-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" />
            <input
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              aria-label={t("common.search")}
              placeholder={t("common.searchPlaceholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value.trim().length < 2) setSuggestions([]);
              }}
              onFocus={() => {
                if (trimmed.length === 0 ? searches.length > 0 : suggestions.length > 0) setShowSuggestions(true);
              }}
              className="h-11 w-full rounded-full border border-line bg-bg ps-10 pe-4 text-sm text-fg transition-colors placeholder:text-subtle hover:border-line-strong focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 [&::-webkit-search-cancel-button]:appearance-none"
            />
          </form>

          {showHistory && (
            <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-[var(--radius-card)] border border-line bg-surface p-2 shadow-[var(--shadow-pop)]">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-subtle">
                  {t("navbar.recentSearches")}
                </span>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-xs font-medium text-muted transition-colors hover:text-brand"
                >
                  {t("navbar.clearRecentSearches")}
                </button>
              </div>
              {searches.map((query) => (
                <button
                  key={query}
                  type="button"
                  onClick={() => runSearch(query)}
                  className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-sm transition-colors hover:bg-surface-2"
                >
                  <ClockIcon className="h-4 w-4 shrink-0 text-subtle" />
                  <span className="truncate">{query}</span>
                </button>
              ))}
            </div>
          )}

          {showResults && (
            <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-pop)]">
              {suggestions.length > 0 ? (
                <ul className="max-h-[22rem] divide-y divide-line overflow-y-auto">
                  {suggestions.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => goToProduct(product.id)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors hover:bg-surface-2"
                      >
                        <SuggestionThumb src={product.image} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{product.name}</span>
                          <span className="block truncate text-xs text-muted">{categoryLabel(product.category)}</span>
                        </span>
                        <span className="text-sm font-bold tabular">{formatPrice(product.price, locale)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-sm text-muted">{t("navbar.noSuggestions")}</p>
              )}
              <button
                type="button"
                onClick={() => runSearch(search)}
                className="flex w-full items-center justify-between gap-2 border-t border-line bg-brand-soft px-4 py-3 text-sm font-semibold text-brand transition-colors hover:bg-surface-2"
              >
                <span className="truncate">{t("navbar.seeAllResultsFor", { search: trimmed })}</span>
                <ChevronEndIcon className="h-4 w-4 shrink-0" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ms-auto flex items-center gap-0.5 md:ms-0 md:gap-1">
          <LanguageSwitcher className="hidden md:inline-flex" />
          <ThemeToggle className="hidden md:inline-flex" />
          <Link
            href="/wishlist"
            locale={locale}
            aria-label={t("common.wishlist")}
            className={cn(iconBtn, "hidden md:inline-flex")}
          >
            <HeartIcon />
            {mounted && <CountBadge count={wishlistCount} />}
          </Link>
          <Link href="/cart" locale={locale} aria-label={t("navbar.cartLabel", { count: mounted ? cartCount : 0 })} className={iconBtn}>
            <CartIcon />
            {mounted && <CountBadge count={cartCount} />}
          </Link>

          {/* Desktop account */}
          <div className="relative ms-1 hidden md:block" ref={userMenuRef}>
            {session ? (
              <>
                <button
                  ref={userButtonRef}
                  type="button"
                  onClick={() => setShowUserMenu((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                  aria-label={t("navbar.accountMenu")}
                  className="flex h-10 items-center gap-2 rounded-full ps-1 pe-2.5 transition-colors hover:bg-surface-2"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-fg">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[7rem] truncate text-sm font-medium lg:inline">{displayName}</span>
                  <ChevronDownIcon
                    className={cn("h-4 w-4 text-muted transition-transform", showUserMenu && "rotate-180")}
                  />
                </button>
                {showUserMenu && (
                  <div
                    role="menu"
                    className="absolute end-0 top-full z-50 mt-2 w-60 rounded-[var(--radius-card)] border border-line bg-surface p-2 shadow-[var(--shadow-pop)]"
                  >
                    <div className="border-b border-line px-3 pb-3 pt-2">
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                      {user?.email && <p className="truncate text-xs text-muted">{user.email}</p>}
                    </div>
                    <div className="py-1.5">
                      {accountLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          locale={locale}
                          role="menuitem"
                          onClick={() => setShowUserMenu(false)}
                          className={menuItem}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-line pt-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut({ callbackUrl: `/${locale}` });
                        }}
                        className={cn(menuItem, "text-danger hover:bg-danger-soft")}
                      >
                        <LogoutIcon className="h-[18px] w-[18px]" />
                        {t("navbar.signOut")}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link href="/login" locale={locale} className={buttonClass("outline", "md")}>
                {t("navbar.signIn")}
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("navbar.openMenu")}
            aria-haspopup="dialog"
            className={cn(iconBtn, "md:hidden")}
          >
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>

      {/* Mobile drawer from the inline-end edge (outside <header>: backdrop-filter would trap position:fixed) */}
      <Sheet open={drawerOpen} onClose={() => setDrawerOpen(false)} side="end" title={t("navbar.menu")}>
        <div className="flex flex-col gap-1 p-3">
          {session && (
            <div className="mb-2 flex items-center gap-3 rounded-[var(--radius-control)] bg-surface-2 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-semibold text-brand-fg">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                {user?.email && <p className="truncate text-xs text-muted">{user.email}</p>}
              </div>
            </div>
          )}
          <Link href="/" locale={locale} onClick={() => setDrawerOpen(false)} className={menuItem}>
            <SearchIcon className="h-[18px] w-[18px] text-muted" />
            {t("navbar.shop")}
          </Link>
          <Link href="/wishlist" locale={locale} onClick={() => setDrawerOpen(false)} className={menuItem}>
            <HeartIcon className="h-[18px] w-[18px] text-muted" />
            <span className="flex-1">{t("common.wishlist")}</span>
            {mounted && wishlistCount > 0 && <span className="text-xs text-muted tabular">{wishlistCount}</span>}
          </Link>
          <Link href="/cart" locale={locale} onClick={() => setDrawerOpen(false)} className={menuItem}>
            <CartIcon className="h-[18px] w-[18px] text-muted" />
            <span className="flex-1">{t("common.cart")}</span>
            {mounted && cartCount > 0 && <span className="text-xs text-muted tabular">{cartCount}</span>}
          </Link>

          <div className="my-2 border-t border-line" />

          {session ? (
            <>
              {accountLinks.map((item) => (
                <Link key={item.href} href={item.href} locale={locale} onClick={() => setDrawerOpen(false)} className={menuItem}>
                  {item.icon}
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  signOut({ callbackUrl: `/${locale}` });
                }}
                className={cn(menuItem, "text-danger hover:bg-danger-soft")}
              >
                <LogoutIcon className="h-[18px] w-[18px]" />
                {t("navbar.signOut")}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 px-1 pt-1">
              <Link href="/login" locale={locale} onClick={() => setDrawerOpen(false)} className={buttonClass("primary", "md", "w-full")}>
                {t("navbar.signIn")}
              </Link>
              <Link href="/register" locale={locale} onClick={() => setDrawerOpen(false)} className={buttonClass("outline", "md", "w-full")}>
                {t("common.register")}
              </Link>
            </div>
          )}

          <div className="my-2 border-t border-line" />

          <div className="flex items-center justify-between px-1">
            <LanguageSwitcher className="-ms-2" />
            <ThemeToggle />
          </div>
        </div>
      </Sheet>
    </>
  );
}
