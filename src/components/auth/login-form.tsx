"use client";

import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { loginAction } from "@/modules/auth/actions";
import { idleAuthState } from "@/lib/auth/form-state";
import type { MessageCode } from "@/lib/auth/messages";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

import { Notice } from "./notice";

type LoginFormProps = {
  locale: Locale;
  copy: Dictionary;
  nextPath: string | null;
  notice: MessageCode | null;
};

const fieldClassName =
  "h-12 w-full rounded-xl border border-[#d5e2f0] bg-white ps-11 text-sm text-[#0B1736] outline-none placeholder:text-[#8aa0b8] focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 dark:border-line dark:bg-surface dark:text-foreground";

export function LoginForm({ locale, copy, nextPath, notice }: LoginFormProps) {
  const [state, action, pending] = useActionState(loginAction, idleAuthState);
  const [showPassword, setShowPassword] = useState(false);
  const message = state.message ? copy.messages[state.message] : null;
  const emailError = state.fieldErrors?.email ? copy.messages[state.fieldErrors.email] : undefined;
  const passwordError = state.fieldErrors?.password ? copy.messages[state.fieldErrors.password] : undefined;

  return (
    <form
      key={`${state.status}:${state.message ?? ""}:${state.fieldErrors?.email ?? ""}:${state.values?.remember ?? ""}`}
      action={action}
      className="flex flex-col gap-4"
      noValidate
      aria-busy={pending}
    >
      <input type="hidden" name="locale" value={locale} />
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      {notice && state.status === "idle" ? (
        <Notice tone={notice === "password_updated" ? "success" : "error"}>
          {copy.messages[notice]}
        </Notice>
      ) : null}
      {state.status === "error" && message ? <Notice tone="error">{message}</Notice> : null}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-[#0B1736] dark:text-foreground">{copy.auth.emailAddress}</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7f93ab]" aria-hidden="true" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={copy.auth.emailPlaceholder}
            defaultValue={state.values?.email ?? ""}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "email-error" : undefined}
            className={`${fieldClassName} pe-3`}
          />
        </div>
        {emailError ? <p id="email-error" className="text-sm text-red-700 dark:text-red-400">{emailError}</p> : null}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-[#0B1736] dark:text-foreground">{copy.auth.password}</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7f93ab]" aria-hidden="true" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={copy.auth.passwordPlaceholder}
            defaultValue={state.values?.password ?? ""}
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={passwordError ? "password-error" : undefined}
            className={`${fieldClassName} pe-11`}
          />
          <button
            type="button"
            aria-label={showPassword ? copy.auth.hidePassword : copy.auth.showPassword}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
            className="absolute end-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#7f93ab] hover:text-[#0B1736] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5722]"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {passwordError ? <p id="password-error" className="text-sm text-red-700 dark:text-red-400">{passwordError}</p> : null}
      </div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="inline-flex items-center gap-2 text-[#415066] dark:text-muted">
          <input
            type="checkbox"
            name="remember"
            value="1"
            defaultChecked={state.values?.remember !== "0"}
            className="size-4 rounded border-[#c5d4e6] accent-[#FF5722]"
          />
          {copy.auth.rememberMe}
        </label>
        <Link href={`/${locale}/forgot-password`} className="font-medium text-[#FF5722] hover:text-[#f0441e]">
          {copy.auth.forgotLink}
        </Link>
      </div>
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff7043] to-[#ff5722] text-sm font-semibold text-white shadow-sm transition hover:from-[#ff5722] hover:to-[#f0441e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5722] disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
      >
        {pending ? copy.auth.pending : copy.auth.submitLogin}
        {pending ? null : <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />}
      </button>
      <p className="text-center text-sm text-[#6b7c93] dark:text-muted">
        {copy.auth.noAccount}{" "}
        <Link href={`/${locale}/register`} className="font-semibold text-[#FF5722] hover:text-[#f0441e]">
          {copy.nav.register}
        </Link>
      </p>
    </form>
  );
}
