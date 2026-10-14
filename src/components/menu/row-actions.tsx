"use client";

import { MoreHorizontal } from "lucide-react";

import {
  deleteCategoryAction,
  deleteProductAction,
  moveRecordAction,
  setPublishedAction,
} from "@/modules/menus/actions";
import type { MenuCopy } from "@/lib/i18n/menu-copy";
import type { Locale } from "@/lib/i18n/locales";

import { ConfirmForm } from "./confirm-form";

type RowActionsProps = {
  locale: Locale;
  copy: MenuCopy;
  businessId: string;
  recordId: string;
  kind: "category" | "product";
  isPublished: boolean;
  editHref: string;
};

const itemClassName =
  "flex w-full items-center rounded-lg px-3 py-2 text-start text-sm hover:bg-surface-muted";

export function RowActions({ locale, copy, businessId, recordId, kind, isPublished, editHref }: RowActionsProps) {
  const deleteAction = kind === "category" ? deleteCategoryAction : deleteProductAction;
  const deleteFields: Record<string, string> = { locale, businessId };
  if (kind === "category") {
    deleteFields.categoryId = recordId;
  } else {
    deleteFields.productId = recordId;
  }

  return (
    <details className="relative">
      <summary
        className="inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-foreground [&::-webkit-details-marker]:hidden"
        aria-label={copy.moreActions}
      >
        <MoreHorizontal className="size-4" />
      </summary>
      <div className="absolute end-0 z-20 mt-1 w-48 rounded-2xl border border-line bg-surface p-1 shadow-[var(--shadow-card)]">
        <a href={editHref} className={itemClassName}>{copy.edit}</a>
        <MoveForm locale={locale} businessId={businessId} recordId={recordId} kind={kind} direction="up" label={copy.moveUp} />
        <MoveForm locale={locale} businessId={businessId} recordId={recordId} kind={kind} direction="down" label={copy.moveDown} />
        <form action={setPublishedAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="recordId" value={recordId} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="published" value={isPublished ? "0" : "1"} />
          <button className={itemClassName} type="submit">{isPublished ? copy.unpublish : copy.publish}</button>
        </form>
        <div className="border-t border-line px-1 py-1">
          <ConfirmForm
            action={deleteAction}
            title={kind === "category" ? copy.deleteCategory : copy.deleteProduct}
            description={kind === "category" ? copy.confirmCategory : copy.confirmProduct}
            confirmLabel={copy.confirm}
            cancelLabel={copy.cancel}
            triggerLabel={kind === "category" ? copy.deleteCategory : copy.deleteProduct}
            fields={deleteFields}
          />
        </div>
      </div>
    </details>
  );
}

function MoveForm({
  locale,
  businessId,
  recordId,
  kind,
  direction,
  label,
}: {
  locale: Locale;
  businessId: string;
  recordId: string;
  kind: string;
  direction: "up" | "down";
  label: string;
}) {
  return (
    <form action={moveRecordAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="recordId" value={recordId} />
      <input type="hidden" name="kind" value={kind} />
      <button className={itemClassName} name="direction" value={direction} type="submit">{label}</button>
    </form>
  );
}
