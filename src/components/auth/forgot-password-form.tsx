"use client";

import { ArrowLeft, ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { idleAuthState } from "@/lib/auth/form-state";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { forgotPasswordAction } from "@/modules/auth/actions";

import { Notice } from "./notice";

type ForgotPasswordFormProps = {
  locale: Locale;
  copy: Dictionary;
  sent?: boolean;
  email?: string | null;
};

const fieldClassName =
  "h-12 w-full rounded-xl border border-[#d5e2f0] bg-white ps-11 pe-3 text-sm text-[#0B1736] outline-none placeholder:text-[#8aa0b8] focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 dark:border-line dark:bg-surface dark:text-foreground";

const buttonClassName =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff7043] to-[#ff5722] text-sm font-semibold text-white shadow-sm transition hover:from-[#ff5722] hover:to-[#f0441e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5722] disabled:cursor-wait disabled:opacity-60";

export function ForgotPasswordForm({ locale, copy, sent = false, email = null }: ForgotPasswordFormProps) {
  const [state, action, pending] = useActionState(forgotPasswordAction, idleAuthState);
  const message = state.message ? copy.messages[state.message] : null;
  const emailError = state.fieldErrors?.email ? copy.messages[state.fieldErrors.email] : undefined;

  if (sent) {
    return <ResetConfirmation locale={locale} copy={copy} email={email} pending={pending} action={action} message={state.status === "error" ? message : null} />;
  }

  return (
    <div className="flex flex-col">
      <RecoveryMark />
      <h2 className="mt-5 text-3xl font-bold tracking-tight text-[#0B1736] dark:text-foreground">{copy.auth.forgotHeading}</h2>
      <p className="mt-2 text-sm leading-6 text-[#6b7c93] dark:text-muted">{copy.auth.forgotLead}</p>
      <form
        key={`${state.status}:${state.message ?? ""}:${state.fieldErrors?.email ?? ""}`}
        action={action}
        className="mt-8 flex flex-col gap-4"
        noValidate
        aria-busy={pending}
      >
        <input type="hidden" name="locale" value={locale} />
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
              className={fieldClassName}
            />
          </div>
          {emailError ? <p id="email-error" className="text-sm text-red-700 dark:text-red-400">{emailError}</p> : null}
        </div>
        <button type="submit" className={buttonClassName} disabled={pending}>
          {pending ? copy.auth.pending : copy.auth.submitForgot}
          {pending ? null : <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />}
        </button>
      </form>
      <div className="mt-5 flex gap-3 rounded-2xl border border-[#d7e3f0] bg-[#f7fbff] p-4 dark:border-line dark:bg-surface-muted">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fff1ea] text-[#FF5722] dark:bg-[#ff5722]/15">
          <Mail className="size-4" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-[#0B1736] dark:text-foreground">{copy.auth.checkEmailTitle}</span>
          <span className="mt-1 block text-sm leading-6 text-[#5d728c] dark:text-muted">{copy.auth.checkEmailBody}</span>
        </span>
      </div>
      <div className="my-5 h-px bg-[#e6eef6] dark:bg-line" />
      <BackLink locale={locale} copy={copy} />
    </div>
  );
}

function ResetConfirmation({
  locale,
  copy,
  email,
  pending,
  action,
  message,
}: {
  locale: Locale;
  copy: Dictionary;
  email: string | null;
  pending: boolean;
  action: (formData: FormData) => void;
  message: string | null;
}) {
  const seconds = useCooldown(30);

  return (
    <div className="flex flex-col items-center text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-[#fff1ea] text-[#FF5722] dark:bg-[#ff5722]/15">
        <Mail className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-3xl font-bold tracking-tight text-[#0B1736] dark:text-foreground">{copy.auth.inboxTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-[#6b7c93] dark:text-muted">{copy.messages.reset_sent}</p>
      {message ? <div className="mt-4 w-full text-start"><Notice tone="error">{message}</Notice></div> : null}
      <Link href={`/${locale}/login`} className={`${buttonClassName} mt-8`}>
        {copy.auth.backToLogin}
      </Link>
      {email ? (
        <form action={action} className="mt-3 w-full">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#d7e3f0] text-sm font-semibold text-[#0B1736] hover:bg-[#f7fbff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5722] disabled:cursor-wait disabled:opacity-60 dark:border-line dark:text-foreground dark:hover:bg-surface-muted"
            disabled={pending || seconds > 0}
          >
            {pending ? copy.auth.pending : seconds > 0 ? copy.auth.resendWait.replaceAll("{seconds}", String(seconds)) : copy.auth.resendEmail}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function useCooldown(start: number) {
  const [left, setLeft] = useState(start);
  useEffect(() => {
    if (left <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);
  return left;
}

function RecoveryMark() {
  return (
    <span className="relative inline-flex size-16 items-center justify-center rounded-full bg-[#fff1ea] text-[#FF5722] dark:bg-[#ff5722]/15" aria-hidden="true">
      <Mail className="size-7" />
      <span className="absolute end-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-white text-[#FF5722] shadow-sm dark:bg-surface">
        <Lock className="size-3.5" />
      </span>
    </span>
  );
}

function BackLink({ locale, copy }: { locale: Locale; copy: Dictionary }) {
  return (
    <Link href={`/${locale}/login`} className="inline-flex items-center gap-2 text-sm font-medium text-[#415066] hover:text-[#0B1736] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5722] dark:text-muted dark:hover:text-foreground">
      <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
      {copy.auth.backToLogin}
    </Link>
  );
}
