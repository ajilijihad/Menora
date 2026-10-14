"use client";

import { useActionState } from "react";

import { currencies } from "@/lib/menus/money";
import type { MenuCopy } from "@/lib/i18n/menu-copy";
import type { Locale } from "@/lib/i18n/locales";
import type { MenuMessageCode } from "@/lib/menus/schema";
import { updateCurrencyAction } from "@/modules/menus/actions";

type CurrencyFormProps = {
  locale: Locale;
  copy: MenuCopy;
  businessId: string;
  currency: string;
  canEdit: boolean;
};

export function CurrencyForm({ locale, copy, businessId, currency, canEdit }: CurrencyFormProps) {
  const [state, action, pending] = useActionState(updateCurrencyAction, null);
  const message = state && "message" in state ? (state.message as MenuMessageCode) : null;

  if (!canEdit) {
    return (
      <p className="text-sm text-muted">
        {copy.fields.currency}: {currency}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="businessId" value={businessId} />
      <label className="flex min-w-0 flex-col gap-1 text-xs text-muted">
        {copy.fields.currency}
        <select
          name="currency"
          defaultValue={currency}
          className="h-11 min-w-44 rounded-xl border border-line bg-surface px-3 text-sm text-foreground"
        >
          {currencies.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code} · {copy.currencies[item.code]}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="mt-5 h-11 rounded-xl border border-line px-4 text-sm font-semibold" disabled={pending}>
        {pending ? copy.pending : copy.save}
      </button>
      {message ? <p className="text-sm text-red-600 dark:text-red-300">{copy.messages[message]}</p> : null}
    </form>
  );
}
