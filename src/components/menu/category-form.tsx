"use client";

import { ArrowRight, ImagePlus, Loader2, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";

import { Notice } from "@/components/auth/notice";
import { Checkbox } from "@/components/ui/checkbox";
import type { MenuCopy } from "@/lib/i18n/menu-copy";
import type { Locale } from "@/lib/i18n/locales";
import { categoryIcons, type CategoryIcon } from "@/lib/menus/category-icons";
import { categoryDescriptionMax, categoryNameMax, type MenuMessageCode } from "@/lib/menus/schema";
import { saveCategoryAction } from "@/modules/menus/actions";

import { CategoryGlyph } from "./category-glyph";
import { prepareMenuImage } from "./prepare-image";

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
    icon: CategoryIcon | null;
    imageUrl: string | null;
  };
};

type Picture =
  | { kind: "none" }
  | { kind: "icon"; icon: CategoryIcon }
  | { kind: "image"; preview: string };

const fieldClassName =
  "w-full rounded-xl border border-line bg-surface text-sm text-foreground outline-none transition placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

function pictureButtonClass(selected: boolean) {
  return `inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
    selected ? "border-brand bg-brand/20 text-brand" : "border-line bg-surface text-muted hover:text-foreground"
  }`;
}

function startingPicture(initial: CategoryFormProps["initial"]): Picture {
  if (initial.imageUrl) {
    return { kind: "image", preview: initial.imageUrl };
  }
  if (initial.icon) {
    return { kind: "icon", icon: initial.icon };
  }
  return { kind: "none" };
}

export function CategoryForm({ locale, copy, businessId, categoryId, initial }: CategoryFormProps) {
  const [state, action, pending] = useActionState(
    async (previous: { message: MenuMessageCode } | null, formData: FormData) => {
      const file = formData.get("image");
      if (file instanceof File && file.size > 0) {
        formData.set("image", await prepareMenuImage(file));
      }
      return saveCategoryAction(previous, formData);
    },
    null,
  );
  const message = state?.message ?? null;
  const [description, setDescription] = useState(initial.description);
  const [descriptionAr, setDescriptionAr] = useState(initial.descriptionAr);
  const selectionKey = `${categoryId ?? "new"}:${initial.icon ?? ""}:${initial.imageUrl ?? ""}`;
  const [trackedSelection, setTrackedSelection] = useState(selectionKey);
  const [picture, setPicture] = useState<Picture>(() => startingPicture(initial));
  if (trackedSelection !== selectionKey) {
    setTrackedSelection(selectionKey);
    setPicture(startingPicture(initial));
  }
  const fileRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
      }
    };
  }, []);

  function clearFile() {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  function chooseNone() {
    clearFile();
    setPicture({ kind: "none" });
  }

  function chooseIcon(icon: CategoryIcon) {
    clearFile();
    setPicture({ kind: "icon", icon });
  }

  function chooseFile(file: File) {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
    }
    const preview = URL.createObjectURL(file);
    blobRef.current = preview;
    setPicture({ kind: "image", preview });
  }

  return (
    <form action={action} className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="icon" value={picture.kind === "icon" ? picture.icon : ""} />
      {initial.imageUrl && picture.kind !== "image" ? <input type="hidden" name="removeImage" value="1" /> : null}
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

      <fieldset className="mt-5 border-t border-line pt-5">
        <legend className="text-sm font-medium text-foreground">{copy.categoryPicture}</legend>
        <p className="mt-1 text-sm text-muted">{copy.categoryPictureHint}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-pressed={picture.kind === "none"}
            onClick={chooseNone}
            className={pictureButtonClass(picture.kind === "none")}
          >
            {copy.categoryNoPicture}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={pictureButtonClass(picture.kind === "image")}
          >
            <ImagePlus className="size-4" aria-hidden="true" />
            {copy.categoryImport}
          </button>
          {picture.kind === "image" ? (
            // The preview is either the stored image or a local file the user just chose.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={picture.preview} alt="" className="size-14 rounded-xl object-cover" />
          ) : null}
          <input
            ref={fileRef}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                chooseFile(file);
              }
            }}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {categoryIcons.map((icon) => {
            const selected = picture.kind === "icon" && picture.icon === icon;
            return (
              <button
                key={icon}
                type="button"
                aria-pressed={selected}
                aria-label={copy.categoryIcons[icon]}
                onClick={() => chooseIcon(icon)}
                className={`${pictureButtonClass(selected)} h-auto flex-col gap-1 px-2 py-2 text-xs`}
              >
                <CategoryGlyph icon={icon} imageUrl={null} className="size-5" />
                <span>{copy.categoryIcons[icon]}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:gap-8">
        <Checkbox name="isActive" label={copy.fields.available} description={copy.availableHint} defaultChecked={initial.isActive} />
        <Checkbox name="isPublished" label={copy.fields.published} description={copy.publishedHint} defaultChecked={initial.isPublished} />
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
