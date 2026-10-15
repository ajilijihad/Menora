"use client";

import { ArrowRight, Check, Loader2, Tag } from "lucide-react";
import { useState } from "react";
import { useActionState } from "react";

import { Notice } from "@/components/auth/notice";
import type { MenuCopy } from "@/lib/i18n/menu-copy";
import type { Locale } from "@/lib/i18n/locales";
import { categoryDescriptionMax, categoryNameMax, type MenuMessageCode } from "@/lib/menus/schema";
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

const fieldClassName =
  "w-full rounded-xl border border-line bg-surface text-sm text-foreground outline-none transition placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function CategoryForm({ locale, copy, businessId, categoryId, initial }: CategoryFormProps) {
  const [state, action, pending] = useActionState(saveCategoryAction, null);
  const message = state && "message" in state ? (state.message as MenuMessageCode) : null;
  const [description, setDescription] = useState(initial.description);
  const [descriptionAr, setDescriptionAr] = useState(initial.descriptionAr);

  return (
    <form action={action} className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="businessId" value={businessId} />
      {categoryId ? <input type="hidden" name="categoryId" value={categoryId} /> : null}
      {message ? (
        <div className="mb-5">
          <Notice tone="error">{copy.messages[message]}</Notice>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <NameField
          id="name"
          name="name"
          label={copy.fields.name}
          placeholder={copy.namePlaceholder}
          defaultValue={initial.name}
          dir="ltr"
          required
        />
        <NameField
          id="nameAr"
          name="nameAr"
          label={copy.fields.nameAr}
          placeholder={copy.nameArPlaceholder}
          defaultValue={initial.nameAr}
          dir="rtl"
          required
        />
        <DescriptionField
          id="description"
          name="description"
          label={copy.fields.description}
          placeholder={copy.descriptionPlaceholder}
          value={description}
          dir="ltr"
          onChange={setDescription}
        />
        <DescriptionField
          id="descriptionAr"
          name="descriptionAr"
          label={copy.fields.descriptionAr}
          placeholder={copy.descriptionArPlaceholder}
          value={descriptionAr}
          dir="rtl"
          onChange={setDescriptionAr}
        />
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:gap-8">
        <StatusOption name="isActive" label={copy.fields.available} hint={copy.availableHint} defaultChecked={initial.isActive} />
        <StatusOption name="isPublished" label={copy.fields.published} hint={copy.publishedHint} defaultChecked={initial.isPublished} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {pending ? copy.pending : categoryId ? copy.save : copy.createCategory}
        {pending ? null : <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />}
      </button>
    </form>
  );
}

function NameField({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  dir,
  required,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  dir: "ltr" | "rtl";
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="text-brand" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <div dir={dir} className="relative">
        <Tag className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={id}
          name={name}
          type="text"
          dir={dir}
          required={required}
          maxLength={categoryNameMax}
          autoComplete="off"
          placeholder={placeholder}
          defaultValue={defaultValue}
          aria-required={required || undefined}
          className={`${fieldClassName} h-11 ps-10 pe-3`}
        />
      </div>
    </div>
  );
}

function DescriptionField({
  id,
  name,
  label,
  placeholder,
  value,
  dir,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  value: string;
  dir: "ltr" | "rtl";
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div dir={dir} className="relative">
        <textarea
          id={id}
          name={name}
          dir={dir}
          rows={4}
          maxLength={categoryDescriptionMax}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClassName} resize-none px-3 py-3 pb-7`}
        />
        <span className="pointer-events-none absolute bottom-2 end-3 text-xs tabular-nums text-muted">
          {value.length}/{categoryDescriptionMax}
        </span>
      </div>
    </div>
  );
}

function StatusOption({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) {
  const hintId = `${name}-hint`;
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 grid size-5 shrink-0">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          aria-describedby={hintId}
          className="peer col-start-1 row-start-1 size-5 appearance-none rounded-md border border-line bg-surface checked:border-brand checked:bg-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
        <Check className="pointer-events-none col-start-1 row-start-1 size-3.5 place-self-center text-white opacity-0 peer-checked:opacity-100" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span id={hintId} className="mt-0.5 block text-xs text-muted">
          {hint}
        </span>
      </span>
    </label>
  );
}
