"use client";

import Link from "next/link";
import { useActionState } from "react";

import { TextField } from "@/components/auth/text-field";
import { Notice } from "@/components/auth/notice";
import { submitClassName } from "@/components/auth/styles";
import { idleDeleteState } from "@/lib/businesses/form-state";
import type { BusinessCopy } from "@/lib/i18n/business-copy";
import type { Locale } from "@/lib/i18n/locales";
import { deleteBusinessAction } from "@/modules/businesses/actions";

type DeleteBusinessFormProps = {
  locale: Locale;
  copy: BusinessCopy;
  businessId: string;
  cancelHref: string;
};

export function DeleteBusinessForm({ locale, copy, businessId, cancelHref }: DeleteBusinessFormProps) {
  const [state, action, pending] = useActionState(deleteBusinessAction, idleDeleteState);

  return (
    <form
      action={action}
      className="flex flex-col gap-4"
      noValidate
      aria-busy={pending}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="businessId" value={businessId} />
      {state.status === "error" && state.message ? (
        <Notice tone="error">{copy.messages[state.message]}</Notice>
      ) : null}
      <TextField
        id="confirmSlug"
        name="confirmSlug"
        type="text"
        label={copy.fields.confirmSlug}
        autoComplete="off"
        hint={copy.fields.confirmHint}
        defaultValue={state.confirmSlug ?? ""}
        error={state.message === "confirm_mismatch" ? copy.messages.confirm_mismatch : undefined}
      />
      <div className="flex flex-wrap gap-3">
        <button type="submit" className={submitClassName} disabled={pending}>
          {pending ? copy.pending : copy.submitDelete}
        </button>
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-700"
        >
          {copy.cancel}
        </Link>
      </div>
    </form>
  );
}
