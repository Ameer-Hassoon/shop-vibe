"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Badge, Button, EmptyState } from "@/components/ui";
import { IconAlert, IconChevron } from "./icons";

export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <header className="mb-6 sm:mb-8">
      {back && <div className="mb-3">{back}</div>}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

export function shortId(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-surface-2", className)} />;
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  return (
    <EmptyState
      icon={<IconAlert />}
      title={t("loadError")}
      description={message || t("loadErrorDesc")}
      action={onRetry && <Button variant="outline" onClick={onRetry}>{tc("retry")}</Button>}
    />
  );
}

const STATUS_TONE = {
  PENDING: "warning",
  CONFIRMED: "brand",
  PROCESSING: "brand",
  SHIPPED: "accent",
  DELIVERED: "success",
  CANCELLED: "danger",
} as const;

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("admin");
  const tone = STATUS_TONE[status as keyof typeof STATUS_TONE] ?? "neutral";
  const known = status in STATUS_TONE;
  return <Badge tone={tone}>{known ? t(`status.${status}`) : status}</Badge>;
}

export function Notice({
  tone = "success",
  children,
  onDismiss,
}: {
  tone?: "success" | "danger";
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  const tc = useTranslations("common");
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "mb-5 flex items-start justify-between gap-3 rounded-[var(--radius-control)] px-4 py-3 text-sm font-medium",
        tone === "success" ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
      )}
    >
      <span>{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 text-xs underline underline-offset-2">
          {tc("close")}
        </button>
      )}
    </div>
  );
}

/** Previous / next pager with a "Page x of y" label. */
export function AdminPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={t("pagination")} className="mt-5 flex items-center justify-between gap-3">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <IconChevron className="h-4 w-4 rotate-180" />
        {tc("previous")}
      </Button>
      <span className="text-sm text-muted tabular">{t("pageOf", { page, total: totalPages })}</span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        {tc("next")}
        <IconChevron className="h-4 w-4" />
      </Button>
    </nav>
  );
}

export function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export function ProductThumb({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const bad = !src || failed === src;
  return (
    <div className={cn("h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2", className)}>
      {!bad && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(src ?? null)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
