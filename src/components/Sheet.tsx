"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { CloseIcon } from "./icons";

/**
 * Modal panel that slides in from the inline-end edge (side drawer, mirrored in RTL)
 * or from the bottom (mobile bottom sheet). Always mounted so it can animate out; hidden
 * panels are `invisible`, which also removes them from the tab order.
 */
export function Sheet({
  open,
  onClose,
  side = "end",
  title,
  footer,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  side?: "end" | "bottom";
  title: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("common");
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return (
    <div
      className={cn("fixed inset-0 z-[60]", open ? "visible" : "invisible pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-fg/40 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "absolute flex flex-col bg-surface shadow-[var(--shadow-pop)] outline-none transition-transform duration-200 ease-out",
          side === "end"
            ? "inset-y-0 end-0 w-[min(22rem,88vw)] border-s border-line " +
                (open ? "translate-x-0" : "translate-x-full rtl:-translate-x-full")
            : "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[var(--radius-card)] border-t border-line " +
                (open ? "translate-y-0" : "translate-y-full"),
          className,
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line ps-5 pe-2">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="shrink-0 border-t border-line bg-surface p-4">{footer}</div>}
      </div>
    </div>
  );
}
