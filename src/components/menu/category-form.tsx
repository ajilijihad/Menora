"use client";

import { useActionState } from "react";

import { Notice } from "@/components/auth/notice";
import { submitClassName } from "@/components/auth/styles";
import { TextField } from "@/components/auth/text-field";
import type { MenuCopy } from "@/lib/i18n/menu-copy";
import type { Locale } from "@/lib/i18n/locales";
import type { MenuMessageCode } from "@/lib/menus/schema";
import { saveCategoryAction } from "@/modules/menus/actions";

type CategoryFormProps = {
  locale: Locale;
  copy: MenuCopy;
  businessId: string;
  categoryId?: string;
  initial: {
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    isActive: boolean;
    isPublished: boolean;
  };
};

export function CategoryForm({ locale, copy, businessId, categoryId, initial }: CategoryFormProps) {
  const [state, action, pending] = useActionState(saveCategoryAction, null);
  const message = state && "message" in state ? (state.message as MenuMessageCode) : null;

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="businessId" value={businessId} />
      {categoryId ? <input type="hidden" name="categoryId" value={categoryId} /> : null}
      {message ? <Notice tone="error">{copy.messages[message]}</Notice> : null}
      <TextField id="name" name="name" type="text" label={copy.fields.name} autoComplete="off" defaultValue={initial.name} />
      <TextField id="nameAr" name="nameAr" type="text" label={copy.fields.nameAr} autoComplete="off" defaultValue={initial.nameAr} />
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">{copy.fields.description}</span>
        <textarea name="description" rows={3} defaultValue={initial.description} className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">{copy.fields.descriptionAr}</span>
        <textarea name="descriptionAr" rows={3} defaultValue={initial.descriptionAr} className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={initial.isActive} />
        {copy.fields.available}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPublished" defaultChecked={initial.isPublished} />
        {copy.fields.published}
      </label>
      <button type="submit" className={`${submitClassName} md:w-auto md:px-6`} disabled={pending}>
        {pending ? copy.pending : categoryId ? copy.save : copy.create}
      </button>
    </form>
  );
}
