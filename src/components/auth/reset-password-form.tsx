"use client";

import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Shield } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { idleAuthState } from "@/lib/auth/form-state";
import { passwordChecks } from "@/lib/auth/schemas";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { resetPasswordAction } from "@/modules/auth/actions";

import { Notice } from "./notice";

type ResetPasswordFormProps = {
  locale: Locale;
  copy: Dictionary;
};

const fieldClassName =
  "h-12 w-full rounded-xl border border-[#DCE5F1] bg-white ps-11 text-sm text-[#0B1736] outline-none placeholder:text-[#8aa0b8] focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 dark:border-line dark:bg-surface dark:text-foreground";

const buttonClassName =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff7043] to-[#ff5722] text-sm font-semibold text-white shadow-sm transition hover:from-[#ff5722] hover:to-[#f0441e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5722] motion-reduce:transition-none disabled:cursor-wait disabled:opacity-60";

export function ResetPasswordForm({ locale, copy }: ResetPasswordFormProps) {
  const [state, action, pending] = useActionState(resetPasswordAction, idleAuthState);
  const [password, setPassword] = useState(state.values?.password ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const message = state.message ? copy.messages[state.message] : null;
  const passwordError = state.fieldErrors?.password ? copy.messages[state.fieldErrors.password] : undefined;
  const confirmError = state.fieldErrors?.confirmPassword ? copy.messages[state.fieldErrors.confirmPassword] : undefined;
  const checks = passwordChecks(password);
  const rules = [
    { label: copy.auth.ruleLength, met: checks.length },
    { label: copy.auth.ruleLetter, met: checks.letter },
    { label: copy.auth.ruleNumber, met: checks.number },
  ];

  return (
    <form
      key={`${state.status}:${state.message ?? ""}:${state.fieldErrors?.password ?? ""}:${state.fieldErrors?.confirmPassword ?? ""}`}
      action={action}
      className="flex flex-col gap-4"
      noValidate
      aria-busy={pending}
    >
      <input type="hidden" name="locale" value={locale} />
      {state.status === "error" && message ? <Notice tone="error">{message}</Notice> : null}
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">{copy.auth.password}</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7f93ab]" aria-hidden="true" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={copy.auth.newPasswordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={passwordError ? true : undefined}
            aria-describedby="password-rules"
            className={`${fieldClassName} pe-11`}
          />
          <RevealButton
            pressed={showPassword}
            label={showPassword ? copy.auth.hidePassword : copy.auth.showPassword}
            onClick={() => setShowPassword((current) => !current)}
          />
        </div>
        <p className="text-xs leading-5 text-[#64748B] dark:text-muted">{copy.auth.passwordHint}</p>
        <ul id="password-rules" className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#64748B] dark:text-muted">
          {rules.map((rule) => (
            <li key={rule.label} className="inline-flex items-center gap-1.5">
              <Check className={`size-3.5 ${rule.met ? "text-emerald-600" : "text-[#c5d0dc]"}`} aria-hidden="true" />
              <span>{rule.label}</span>
            </li>
          ))}
        </ul>
        {passwordError ? <p className="text-sm text-red-700 dark:text-red-400">{passwordError}</p> : null}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">{copy.auth.confirmPassword}</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7f93ab]" aria-hidden="true" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder={copy.auth.confirmNewPasswordPlaceholder}
            defaultValue={state.values?.confirmPassword ?? ""}
            aria-invalid={confirmError ? true : undefined}
            aria-describedby={confirmError ? "confirm-error" : undefined}
            className={`${fieldClassName} pe-11`}
          />
          <RevealButton
            pressed={showConfirm}
            label={showConfirm ? copy.auth.hidePassword : copy.auth.showPassword}
            onClick={() => setShowConfirm((current) => !current)}
          />
        </div>
        {confirmError ? <p id="confirm-error" className="text-sm text-red-700 dark:text-red-400">{confirmError}</p> : null}
      </div>
      <button type="submit" className={buttonClassName} disabled={pending}>
        {pending ? copy.auth.pending : copy.auth.submitReset}
        {pending ? null : <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />}
      </button>
      <div className="my-1 h-px bg-[#E6EEF6] dark:bg-line" />
      <p className="flex items-center justify-center gap-2 text-sm text-[#64748B] dark:text-muted">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#f3f6fb] text-[#7f93ab] dark:bg-surface-muted">
          <Shield className="size-4" aria-hidden="true" />
        </span>
        {copy.auth.securityNote}
      </p>
      <Link href={`/${locale}/login`} className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#FF5722] hover:text-[#f0441e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5722]">
        <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        {copy.auth.backToLogin}
      </Link>
    </form>
  );
}

function RevealButton({ pressed, label, onClick }: { pressed: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="absolute end-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#7f93ab] hover:text-[#0B1736] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5722]"
    >
      {pressed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}
