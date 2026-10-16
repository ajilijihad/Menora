"use client";

import { Camera, Info, Lock, Mail, Save, UserRound } from "lucide-react";
import { useActionState } from "react";

import { idleAuthState } from "@/lib/auth/form-state";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { updateProfileAction } from "@/modules/auth/actions";

import { Notice } from "./notice";

type ProfileFormProps = {
  locale: Locale;
  copy: Dictionary;
  name: string;
  email: string;
  roleLabel: string;
  emailConfirmed: boolean;
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-line bg-surface ps-10 pe-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15";

export function ProfileForm({ locale, copy, name, email, roleLabel, emailConfirmed }: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfileAction, idleAuthState);
  const savedName = name.trim();
  const displayName = savedName || email;
  const initial = displayName ? Array.from(displayName)[0] ?? "" : "";
  const nameError = state.fieldErrors?.name ? copy.messages[state.fieldErrors.name] : undefined;

  return (
    <form
      key={`${state.status}:${state.message ?? ""}:${state.fieldErrors?.name ?? ""}`}
      action={action}
      className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      noValidate
      aria-busy={pending}
    >
      <input type="hidden" name="locale" value={locale} />
      {state.status === "success" && state.message ? (
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <Notice tone="success">{copy.messages[state.message]}</Notice>
        </div>
      ) : null}
      {state.status === "error" && state.message ? (
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <Notice tone="error">{copy.messages[state.message]}</Notice>
        </div>
      ) : null}
      <div className="grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
        <aside className="flex flex-col items-center bg-[#fff7f2] px-6 py-8 text-center dark:bg-brand/10 lg:border-e lg:border-brand/10">
          <span className="relative">
            <span className="inline-flex size-20 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-white" aria-hidden="true">
              {initial}
            </span>
            <span className="absolute -bottom-0.5 -end-0.5 inline-flex size-7 items-center justify-center rounded-full border border-[#ffd7c4] bg-white text-brand shadow-sm dark:border-brand/30 dark:bg-surface">
              <Camera className="size-3.5" aria-hidden="true" />
            </span>
          </span>
          <p className="mt-4 text-lg font-semibold text-foreground">{displayName}</p>
          <span className="mt-2 inline-flex rounded-full bg-[#ffe4d4] px-2.5 py-0.5 text-xs font-medium text-brand dark:bg-brand/15">{roleLabel}</span>
          <div className="mt-6 flex w-full flex-col gap-4 border-t border-brand/15 pt-5 text-start">
            <div>
              <p className="flex items-center gap-2 text-xs font-medium text-muted">
                <Mail className="size-3.5" aria-hidden="true" />
                {copy.auth.email}
              </p>
              <p className="mt-1 break-all text-sm font-medium text-foreground">{email}</p>
            </div>
            <div>
              <p className="flex items-center gap-2 text-xs font-medium text-muted">
                <Lock className="size-3.5" aria-hidden="true" />
                {copy.auth.emailStatus}
              </p>
              <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${emailConfirmed ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/12 text-amber-700 dark:text-amber-300"}`}>
                <span className={`size-1.5 rounded-full ${emailConfirmed ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden="true" />
                {emailConfirmed ? copy.auth.verified : copy.auth.unverified}
              </span>
            </div>
          </div>
        </aside>
        <div className="flex flex-col gap-5 p-5 sm:p-8">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">{copy.auth.name}</label>
            <span className="relative">
              <UserRound className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                defaultValue={state.values?.name ?? name}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? "name-error" : undefined}
                className={fieldClassName}
              />
            </span>
            {nameError ? <p id="name-error" className="text-sm text-red-700 dark:text-red-400">{nameError}</p> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-foreground">{copy.auth.email}</p>
            <div className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-surface-muted px-3.5 text-sm text-muted">
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">{email}</span>
            </div>
            <p className="flex items-start gap-2 text-xs leading-5 text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {copy.auth.profileDescription}
            </p>
          </div>
          <div className="border-t border-line pt-5">
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              disabled={pending}
            >
              <Save className="size-4" aria-hidden="true" />
              {pending ? copy.auth.pending : copy.auth.submitProfile}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
