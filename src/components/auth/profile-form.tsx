"use client";

import { useActionState } from "react";

import { idleAuthState } from "@/lib/auth/form-state";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { updateProfileAction } from "@/modules/auth/actions";

import { Notice } from "./notice";
import { submitClassName } from "./styles";
import { TextField } from "./text-field";

type ProfileFormProps = {
  locale: Locale;
  copy: Dictionary;
  name: string;
  email: string;
};

export function ProfileForm({ locale, copy, name, email }: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfileAction, idleAuthState);

  return (
    <form
      key={`${state.status}:${state.message ?? ""}:${state.fieldErrors?.name ?? ""}`}
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
        id="name"
        name="name"
        type="text"
        label={copy.auth.name}
        autoComplete="name"
        defaultValue={state.values?.name ?? name}
        error={state.fieldErrors?.name ? copy.messages[state.fieldErrors.name] : undefined}
      />
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{copy.auth.email}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{email}</p>
      </div>
      <button type="submit" className={submitClassName} disabled={pending}>
        {pending ? copy.auth.pending : copy.auth.submitProfile}
      </button>
    </form>
  );
}
