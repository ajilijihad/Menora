"use client";

import { ArrowRight, Bean, Box, FileText, Fish, Flame, Folder, ImageIcon, Leaf, Loader2, Milk, Nut, Puzzle, Tag, Trash2, Wheat } from "lucide-react";
import { useActionState, useRef, useState, type ComponentType, type ReactNode, type RefObject } from "react";

import { Notice } from "@/components/auth/notice";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { imageExtension } from "@/lib/businesses/media";
import type { MenuCopy } from "@/lib/i18n/menu-copy";
import type { Locale } from "@/lib/i18n/locales";
import { currencyExponent, type CurrencyCode } from "@/lib/menus/money";
import { dietaryLabels, productDescriptionMax, productNameMax, type DietaryLabel, type MenuMessageCode } from "@/lib/menus/schema";
import { saveProductAction } from "@/modules/menus/actions";

import { OptionEditor, type OptionDraft } from "./option-editor";
import { prepareMenuImage } from "./prepare-image";

const fieldClassName =
  "w-full rounded-xl border border-line bg-surface text-sm text-foreground outline-none transition placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const labelIcons: Record<DietaryLabel, ComponentType<{ className?: string }>> = {
  vegetarian: Leaf,
  vegan: Leaf,
  spicy: Flame,
  gluten: Wheat,
  dairy: Milk,
  nuts: Nut,
  shellfish: Fish,
  sesame: Bean,
};

type ProductFormProps = {
  locale: Locale;
  copy: MenuCopy;
  businessId: string;
  currency: CurrencyCode;
  productId?: string;
  categories: { id: string; name: string }[];
  initial: {
    categoryId: string;
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    price: string;
    compareAt: string;
    isActive: boolean;
    isPublished: boolean;
    isFeatured: boolean;
    outOfStock: boolean;
    labels: string[];
  };
  variants: OptionDraft[];
  addons: OptionDraft[];
  images: { id: string; url: string; alt: string }[];
};

export function ProductForm(props: ProductFormProps) {
  const [state, action, pending] = useActionState(
    async (previous: { message: MenuMessageCode } | null, formData: FormData) => {
      const files = formData.getAll("images");
      formData.delete("images");
      for (const file of files) {
        if (file instanceof File && file.size > 0) {
          formData.append("images", await prepareMenuImage(file));
        }
      }
      return saveProductAction(previous, formData);
    },
    null,
  );
  const message = state?.message ?? null;
  const [description, setDescription] = useState(props.initial.description);
  const [descriptionAr, setDescriptionAr] = useState(props.initial.descriptionAr);
  const existing = props.images[0] ?? null;
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const shownUrl = previewUrl ?? (removed ? null : existing?.url ?? null);
  const exponent = currencyExponent(props.currency) ?? 2;
  const pricePlaceholder = exponent === 0 ? "0" : `0.${"0".repeat(exponent)}`;

  function replacePreview(next: string | null) {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }
    previewRef.current = next;
    setPreviewUrl(next);
  }

  function chooseImage(file: File | null) {
    setImageError(null);
    if (!file) {
      return;
    }
    if (!imageExtension(file.type)) {
      setImageError(props.copy.messages.image_type);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
      return;
    }
    setRemoved(false);
    replacePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    replacePreview(null);
    setRemoved(true);
    setImageError(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  return (
    <form action={action} className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-6">
      <input type="hidden" name="locale" value={props.locale} />
      <input type="hidden" name="businessId" value={props.businessId} />
      {props.productId ? <input type="hidden" name="productId" value={props.productId} /> : null}
      {existing && (removed || previewUrl) ? <input type="hidden" name="removeImage" value={existing.id} /> : null}
      {message ? (
        <div className="mb-5">
          <Notice tone="error">{props.copy.messages[message]}</Notice>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,22rem)]">
        <div className="flex flex-col gap-2">
          <label htmlFor="categoryId" className="text-sm font-medium text-foreground">
            {props.copy.categoryLabel}
            <span className="text-brand" aria-hidden="true"> *</span>
          </label>
          <Select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={props.initial.categoryId}
            leading={<Folder className="size-4 text-muted" aria-hidden="true" />}
            options={props.categories.map((category) => ({ value: category.id, label: category.name }))}
            className={`${fieldClassName} h-11 px-3`}
          />
        </div>
        <ImageField
          copy={props.copy}
          fileRef={fileRef}
          shownUrl={shownUrl}
          alt={existing?.alt ?? props.copy.fields.images}
          error={imageError}
          pending={pending}
          onChoose={chooseImage}
          onClear={clearImage}
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextEntry
          id="product-name"
          name="name"
          label={props.copy.fields.name}
          placeholder={props.copy.productNamePlaceholder}
          defaultValue={props.initial.name}
          dir="ltr"
          icon={<Tag className="size-4" aria-hidden="true" />}
          required
          maxLength={productNameMax}
        />
        <TextEntry
          id="product-name-ar"
          name="nameAr"
          label={props.copy.fields.nameAr}
          placeholder={props.copy.productNameArPlaceholder}
          defaultValue={props.initial.nameAr}
          dir="rtl"
          icon={<Tag className="size-4" aria-hidden="true" />}
          required
          maxLength={productNameMax}
        />
        <AreaEntry
          id="product-description"
          name="description"
          label={props.copy.fields.description}
          placeholder={props.copy.productDescriptionPlaceholder}
          value={description}
          dir="ltr"
          onChange={setDescription}
        />
        <AreaEntry
          id="product-description-ar"
          name="descriptionAr"
          label={props.copy.fields.descriptionAr}
          placeholder={props.copy.productDescriptionArPlaceholder}
          value={descriptionAr}
          dir="rtl"
          onChange={setDescriptionAr}
        />
        <PriceEntry
          id="price"
          name="price"
          label={props.copy.fields.price}
          placeholder={pricePlaceholder}
          defaultValue={props.initial.price}
          hint={props.copy.priceHint}
          currency={props.currency}
          locale={props.locale}
          required
        />
        <PriceEntry
          id="compareAt"
          name="compareAt"
          label={props.copy.fields.compareAt}
          placeholder={pricePlaceholder}
          defaultValue={props.initial.compareAt}
          hint={props.copy.compareHint}
          currency={props.currency}
          locale={props.locale}
        />
      </div>

      <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2 xl:grid-cols-4">
        <Checkbox name="isActive" label={props.copy.fields.available} description={props.copy.productAvailableHint} defaultChecked={props.initial.isActive} />
        <Checkbox name="outOfStock" label={props.copy.fields.outOfStock} description={props.copy.productStockHint} defaultChecked={props.initial.outOfStock} />
        <Checkbox name="isPublished" label={props.copy.fields.published} description={props.copy.productPublishedHint} defaultChecked={props.initial.isPublished} />
        <Checkbox name="isFeatured" label={props.copy.fields.featured} description={props.copy.productFeaturedHint} defaultChecked={props.initial.isFeatured} />
      </div>

      <fieldset className="mt-5">
        <legend className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Leaf className="size-4 text-brand" aria-hidden="true" />
          {props.copy.fields.labels}
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {dietaryLabels.map((label) => {
            const Icon = labelIcons[label];
            return (
              <label key={label} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-2 text-sm text-foreground has-[:checked]:border-brand has-[:checked]:bg-orange-500/10 has-[:checked]:text-brand">
                <Checkbox name="label" value={label} defaultChecked={props.initial.labels.includes(label)} />
                <Icon className="size-4" aria-hidden="true" />
                {props.copy.labels[label]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 flex flex-col gap-3">
        <OptionEditor copy={props.copy} prefix="variant" legend={props.copy.fields.variants} hint={props.copy.variantsHint} icon={<Box className="size-4" aria-hidden="true" />} initial={props.variants} />
        <OptionEditor copy={props.copy} prefix="addon" legend={props.copy.fields.addons} hint={props.copy.addonsHint} icon={<Puzzle className="size-4" aria-hidden="true" />} initial={props.addons} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {pending ? props.copy.pending : props.productId ? props.copy.save : props.copy.createProduct}
        {pending ? null : <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />}
      </button>
    </form>
  );
}

function ImageField({
  copy,
  fileRef,
  shownUrl,
  alt,
  error,
  pending,
  onChoose,
  onClear,
}: {
  copy: MenuCopy;
  fileRef: RefObject<HTMLInputElement | null>;
  shownUrl: string | null;
  alt: string;
  error: string | null;
  pending: boolean;
  onChoose: (file: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{copy.fields.images}</span>
      <input
        ref={fileRef}
        id="product-image"
        type="file"
        name="images"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => onChoose(event.target.files?.[0] ?? null)}
      />
      {shownUrl ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(8.5rem,10rem)]">
          <div className="relative">
            {/* Storage hosts are per project, so this uses a sized image instead of next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shownUrl} alt={alt} className="aspect-[4/3] w-full rounded-xl object-cover" />
            {pending ? (
              <span className="absolute inset-0 grid place-items-center rounded-xl bg-slate-950/35 text-white">
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              </span>
            ) : null}
            <button
              type="button"
              onClick={onClear}
              disabled={pending}
              aria-label={copy.removeRow}
              className="absolute end-2 top-2 grid size-8 place-items-center rounded-lg bg-white/90 text-foreground shadow-sm hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3 py-4 text-center text-sm hover:border-brand hover:bg-orange-500/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60"
          >
            <ImageIcon className="size-5 text-muted" aria-hidden="true" />
            <span className="font-medium">{copy.changeImage}</span>
            <span className="text-xs text-pretty text-muted">{copy.productImageHint}</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-6 text-center hover:border-brand hover:bg-orange-500/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60"
        >
          <ImageIcon className="size-6 text-muted" aria-hidden="true" />
          <span className="text-sm font-medium">{copy.uploadImage}</span>
          <span className="text-xs text-muted">{copy.productImageHint}</span>
        </button>
      )}
      {error ? <p className="text-sm text-red-700 dark:text-red-400">{error}</p> : null}
    </div>
  );
}

function TextEntry({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  dir,
  icon,
  required,
  maxLength,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  dir: "ltr" | "rtl";
  icon: ReactNode;
  required?: boolean;
  maxLength: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-brand" aria-hidden="true"> *</span> : null}
      </label>
      <div dir={dir} className="relative">
        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
        <input
          id={id}
          name={name}
          type="text"
          dir={dir}
          required={required}
          maxLength={maxLength}
          autoComplete="off"
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={`${fieldClassName} h-11 ps-10 pe-3`}
        />
      </div>
    </div>
  );
}

function AreaEntry({
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
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
      <div dir={dir} className="relative">
        <FileText className="pointer-events-none absolute start-3 top-3 size-4 text-muted" aria-hidden="true" />
        <textarea
          id={id}
          name={name}
          dir={dir}
          rows={4}
          maxLength={productDescriptionMax}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClassName} resize-none py-3 ps-10 pe-3 pb-7`}
        />
        <span className="pointer-events-none absolute bottom-2 end-3 text-xs tabular-nums text-muted">
          {value.length}/{productDescriptionMax}
        </span>
      </div>
    </div>
  );
}

function PriceEntry({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  hint,
  currency,
  locale,
  required,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  hint: string;
  currency: CurrencyCode;
  locale: Locale;
  required?: boolean;
}) {
  const hintId = `${id}-hint`;
  let mark: string = currency;
  try {
    mark = new Intl.NumberFormat(locale === "ar" ? "ar" : "en", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency;
  } catch {
    mark = currency;
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-brand" aria-hidden="true"> *</span> : null}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted">{mark}</span>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          required={required}
          autoComplete="off"
          placeholder={placeholder}
          defaultValue={defaultValue}
          aria-describedby={hintId}
          className={`${fieldClassName} h-11 ps-12 pe-3`}
        />
      </div>
      <p id={hintId} className="text-xs text-muted">{hint}</p>
    </div>
  );
}
