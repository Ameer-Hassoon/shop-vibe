"use client";

import { forwardRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui";
import { EyeIcon, EyeOffIcon } from "./icons";

/** Password input with a show / hide toggle. Accepts the props Field passes (id, aria-*). */
export const PasswordInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput({ className, ...props }, ref) {
    const t = useTranslations("auth");
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? "text" : "password"} className={`pe-12 ${className ?? ""}`} dir="ltr" {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          aria-pressed={visible}
          className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-[var(--radius-control)] text-muted transition-colors hover:text-fg"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    );
  },
);
