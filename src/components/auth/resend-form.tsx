"use client";

import { useActionState } from "react";

import { idleAuthState } from "@/lib/auth/form-state";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { resendConfirmationAction } from "@/modules/auth/actions";

import { Notice } from "./notice";
import { submitClassName } from "./styles";
import { TextField } from "./text-field";

type ResendFormProps = {
  locale: Locale;
  copy: Dictionary;
};

export function ResendForm({ locale, copy }: ResendFormProps) {
  const [state, action, pending] = useActionState(resendConfirmationAction, idleAuthState);

  return (
    <form
      key={`${state.status}:${state.message ?? ""}:${state.fieldErrors?.email ?? ""}`}
      action={action}
      className="flex flex-col gap-4"
      noValidate
      aria-busy={pending}
    >
      <input type="hidden" name="locale" value={locale} />
      {state.status === "success" && state.message ? (
        <Notice tone="success">{copy.messages[state.message]}</Notice>
      ) : null}
      {state.status === "error" && state.message ? (
        <Notice tone="error">{copy.messages[state.message]}</Notice>
      ) : null}
      <TextField
        id="email"
        name="email"
        type="email"
        label={copy.auth.email}
        autoComplete="email"
        defaultValue={state.values?.email ?? ""}
        error={state.fieldErrors?.email ? copy.messages[state.fieldErrors.email] : undefined}
      />
      <button type="submit" className={submitClassName} disabled={pending}>
        {pending ? copy.auth.pending : copy.auth.submitResend}
      </button>
    </form>
  );
}
