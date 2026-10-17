"use client";

import { Check, Copy, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { Notice } from "@/components/auth/notice";
import { Checkbox } from "@/components/ui/checkbox";
import { idleDeleteState } from "@/lib/businesses/form-state";
import type { BusinessCopy } from "@/lib/i18n/business-copy";
import type { Locale } from "@/lib/i18n/locales";
import { deleteBusinessAction } from "@/modules/businesses/actions";

type DeleteBusinessFormProps = {
  locale: Locale;
  copy: BusinessCopy;
  businessId: string;
  slug: string;
  cancelHref: string;
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand aria-invalid:border-red-500";

export function DeleteBusinessForm({ locale, copy, businessId, slug, cancelHref }: DeleteBusinessFormProps) {
  const [state, action, pending] = useActionState(deleteBusinessAction, idleDeleteState);
  const [confirmSlug, setConfirmSlug] = useState(state.confirmSlug ?? "");
  const [acknowledged, setAcknowledged] = useState(false);
  const trimmedSlug = confirmSlug.trim();
  const matches = trimmedSlug === slug;
  const showMismatch = confirmSlug.length > 0 && !matches;
  const canSubmit = matches && acknowledged && !pending;
  const submittedSlug = state.confirmSlug ?? "";
  const serverError =
    state.status === "error" && state.message && (state.message !== "confirm_mismatch" || (matches && trimmedSlug === submittedSlug))
      ? state.message
      : null;
  const prompt = splitAroundSlug(copy.confirmPrompt, slug);
  const exactMessage = splitAroundSlug(copy.confirmExact, slug);
  const hintId = "confirmSlug-hint";
  const errorId = "confirmSlug-error";
  const describedBy = showMismatch ? errorId : hintId;

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5"
      noValidate
      aria-busy={pending}
      onSubmit={(event) => {
        if (!canSubmit) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="businessId" value={businessId} />
      {serverError ? <Notice tone="error">{copy.messages[serverError]}</Notice> : null}
      <div className="flex flex-col gap-2">
        <label htmlFor="confirmSlug" className="text-sm font-semibold text-foreground">
          {prompt.before}
          <span dir="ltr" className="font-semibold text-red-600 dark:text-red-400">
            {slug}
          </span>
          {prompt.after}
        </label>
        <p className="text-sm leading-6 text-muted">{copy.fields.confirmHint}</p>
        <input
          id="confirmSlug"
          name="confirmSlug"
          type="text"
          dir="ltr"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={copy.confirmPlaceholder}
          value={confirmSlug}
          aria-invalid={showMismatch || undefined}
          aria-describedby={describedBy}
          onChange={(event) => setConfirmSlug(event.target.value)}
          className={`${fieldClassName} text-start`}
        />
        {showMismatch ? (
          <p id={errorId} className="text-sm text-red-600 dark:text-red-300" role="alert">
            {exactMessage.before}
            <span dir="ltr">{slug}</span>
            {exactMessage.after}
          </p>
        ) : (
          <p id={hintId} className="text-sm text-muted">
            {exactMessage.before}
            <span dir="ltr">{slug}</span>
            {exactMessage.after}
          </p>
        )}
      </div>
      <Checkbox
        checked={acknowledged}
        disabled={pending}
        onCheckedChange={setAcknowledged}
        label={copy.acknowledgeLabel}
        description={copy.acknowledgeHint}
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ff6b6b] text-sm font-semibold text-white transition hover:bg-[#f25555] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
        {pending ? copy.pending : copy.submitDelete}
      </button>
      <Link
        href={cancelHref}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-line bg-surface text-sm font-medium text-foreground transition hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {copy.cancelReturn}
      </Link>
    </form>
  );
}

type CopyTextButtonProps = {
  value: string;
  label: string;
  copiedLabel: string;
};

export function CopyTextButton({ value, label, copiedLabel }: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={copied ? copiedLabel : label}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          },
          () => setCopied(false),
        );
      }}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {copied ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
    </button>
  );
}

function splitAroundSlug(template: string, slug: string) {
  const token = "{slug}";
  const index = template.indexOf(token);
  if (index === -1) {
    return { before: template.replaceAll(token, slug), after: "" };
  }

  return {
    before: template.slice(0, index),
    after: template.slice(index + token.length),
  };
}
