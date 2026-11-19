"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useTranslations } from "next-intl";

/** Square product image with a neutral fallback when the image is missing or fails to load. */
export function ProductThumb({
  src,
  alt,
  className,
  sizes = "96px",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const t = useTranslations("common");
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-xl bg-surface-2", className)}>
      {!src || failed ? (
        <span className="absolute inset-0 flex items-center justify-center p-1 text-center text-[10px] text-subtle">
          {t("noImage")}
        </span>
      ) : (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" onError={() => setFailed(true)} />
      )}
    </div>
  );
}
