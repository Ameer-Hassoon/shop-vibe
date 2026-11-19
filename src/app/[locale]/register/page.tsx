"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button, Card, Field, Input } from "@/components/ui";
import { PasswordInput } from "@/components/account/PasswordInput";
import { safeCallback } from "@/components/account/authRedirect";
import { AlertIcon } from "@/components/account/icons";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function RegisterForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const callbackUrl = safeCallback(useSearchParams().get("callbackUrl"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    const errs: typeof fieldErrors = {};
    if (!email.trim()) errs.email = t("emailRequired");
    else if (!emailRe.test(email.trim())) errs.email = t("emailInvalid");
    if (!password) errs.password = t("passwordRequired");
    else if (password.length < MIN_PASSWORD) errs.password = t("passwordTooShort", { min: MIN_PASSWORD });
    setFieldErrors(errs);
    if (errs.email || errs.password) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, email: email.trim(), password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = typeof data?.error === "string" ? data.error : "";
        if (res.status === 429) setError(t("rateLimited"));
        else if (/already exists/i.test(msg)) setFieldErrors({ email: t("emailTaken") });
        else if (/email/i.test(msg) && res.status === 400) setFieldErrors({ email: t("emailInvalid") });
        else if (/password/i.test(msg) && res.status === 400) setFieldErrors({ password: t("passwordTooShort", { min: MIN_PASSWORD }) });
        else setError(t("genericError"));
        setLoading(false);
        return;
      }
      const result = await signIn("credentials", { email: email.trim(), password, redirect: false });
      if (result?.error) {
        // Account exists but automatic sign-in failed (for example rate limited): send them to log in.
        router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError(t("genericError"));
      setLoading(false);
    }
  }

  const loginHref = callbackUrl !== "/" ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login";

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("createAccount")}</h1>
        <p className="mt-2 text-muted">{t("registerSubtitle")}</p>
      </div>
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <Field label={t("name")}>
            {(p) => (
              <Input {...p} name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")} />
            )}
          </Field>
          <Field label={t("email")} error={fieldErrors.email}>
            {(p) => (
              <Input {...p} type="email" name="email" autoComplete="email" inputMode="email" dir="ltr" className="text-start"
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("enterYourEmail")} />
            )}
          </Field>
          <Field label={t("password")} error={fieldErrors.password} hint={t("passwordHint", { min: MIN_PASSWORD })}>
            {(p) => (
              <PasswordInput {...p} name="password" autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            )}
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? t("creatingAccount") : t("createAccount")}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {t("alreadyHaveAccount")}{" "}
          <Link href={loginHref} className="font-semibold text-brand hover:underline">
            {tc("login")}
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
