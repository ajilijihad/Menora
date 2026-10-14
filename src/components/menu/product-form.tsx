"use client";

import { useActionState } from "react";

import { Notice } from "@/components/auth/notice";
import { submitClassName } from "@/components/auth/styles";
import { TextField } from "@/components/auth/text-field";
import type { MenuCopy } from "@/lib/i18n/menu-copy";
import type { Locale } from "@/lib/i18n/locales";
import { dietaryLabels, type MenuMessageCode } from "@/lib/menus/schema";
import { saveProductAction } from "@/modules/menus/actions";

import { OptionEditor, type OptionDraft } from "./option-editor";
import { prepareMenuImage } from "./prepare-image";

const inputClassName =
  "h-11 w-full rounded-lg border border-zinc-300 bg-transparent px-3 text-sm dark:border-zinc-700";

type ProductFormProps = {
  locale: Locale;
  copy: MenuCopy;
  businessId: string;
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

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      <input type="hidden" name="locale" value={props.locale} />
      <input type="hidden" name="businessId" value={props.businessId} />
      {props.productId ? <input type="hidden" name="productId" value={props.productId} /> : null}
      {message ? <Notice tone="error">{props.copy.messages[message]}</Notice> : null}
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">{props.copy.categoryLabel}</span>
        <select name="categoryId" defaultValue={props.initial.categoryId} className={inputClassName}>
          {props.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField id="product-name" name="name" type="text" label={props.copy.fields.name} autoComplete="off" defaultValue={props.initial.name} />
        <TextField id="product-name-ar" name="nameAr" type="text" label={props.copy.fields.nameAr} autoComplete="off" defaultValue={props.initial.nameAr} />
      </div>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">{props.copy.fields.description}</span>
        <textarea name="description" rows={3} defaultValue={props.initial.description} className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">{props.copy.fields.descriptionAr}</span>
        <textarea name="descriptionAr" rows={3} defaultValue={props.initial.descriptionAr} className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField id="price" name="price" type="text" label={props.copy.fields.price} autoComplete="off" hint={props.copy.priceHint} defaultValue={props.initial.price} />
        <TextField id="compareAt" name="compareAt" type="text" label={props.copy.fields.compareAt} autoComplete="off" defaultValue={props.initial.compareAt} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isActive" defaultChecked={props.initial.isActive} />
          {props.copy.fields.available}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="outOfStock" defaultChecked={props.initial.outOfStock} />
          {props.copy.fields.outOfStock}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPublished" defaultChecked={props.initial.isPublished} />
          {props.copy.fields.published}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isFeatured" defaultChecked={props.initial.isFeatured} />
          {props.copy.fields.featured}
        </label>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">{props.copy.fields.labels}</legend>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {dietaryLabels.map((label) => (
            <label key={label} className="flex items-center gap-2">
              <input type="checkbox" name="label" value={label} defaultChecked={props.initial.labels.includes(label)} />
              {props.copy.labels[label]}
            </label>
          ))}
        </div>
      </fieldset>
      <OptionEditor copy={props.copy} prefix="variant" legend={props.copy.fields.variants} initial={props.variants} />
      <OptionEditor copy={props.copy} prefix="addon" legend={props.copy.fields.addons} initial={props.addons} />
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium">{props.copy.fields.images}</span>
        {props.images.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {props.images.map((image) => (
              <li key={image.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                {/* Storage hosts are per project, so this uses a sized lazy image instead of next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.alt} width={320} height={200} loading="lazy" decoding="async" className="h-36 w-full rounded-md object-cover" />
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" name="removeImage" value={image.id} />
                  {props.copy.removeRow}
                </label>
              </li>
            ))}
          </ul>
        ) : null}
        <input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple />
        <p className="text-sm text-zinc-500">{props.copy.imageHint}</p>
      </div>
      <button type="submit" className={`${submitClassName} md:w-auto md:px-6`} disabled={pending}>
        {pending ? props.copy.pending : props.productId ? props.copy.save : props.copy.create}
      </button>
    </form>
  );
}
