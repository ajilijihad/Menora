"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { MenuCopy } from "@/lib/i18n/menu-copy";
import { Checkbox } from "@/components/ui/checkbox";

export type OptionDraft = {
  key: string;
  id: string;
  name: string;
  nameAr: string;
  price: string;
  active: boolean;
};

const inputClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

type OptionEditorProps = {
  copy: MenuCopy;
  prefix: "variant" | "addon";
  legend: string;
  hint: string;
  icon: ReactNode;
  initial: OptionDraft[];
};

export function OptionEditor({ copy, prefix, legend, hint, icon, initial }: OptionEditorProps) {
  const [rows, setRows] = useState<OptionDraft[]>(initial);
  const [open, setOpen] = useState(initial.length > 0);

  function update(key: string, patch: Partial<OptionDraft>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setOpen(true);
    setRows((current) => [
      ...current,
      { key: crypto.randomUUID(), id: "", name: "", nameAr: "", price: "", active: true },
    ]);
  }

  return (
    <fieldset className="rounded-xl border border-line">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-brand">{icon}</span>
        <span className="min-w-0 flex-1">
          <legend className="text-sm font-semibold text-foreground">{legend}</legend>
          <span className="mt-0.5 block text-xs text-muted">{hint}</span>
        </span>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex h-9 items-center gap-1 rounded-full px-2 text-sm font-medium text-brand hover:bg-orange-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Plus className="size-4" aria-hidden="true" />
          {copy.addRow}
        </button>
        <button
          type="button"
          aria-expanded={open}
          aria-label={legend}
          onClick={() => setOpen((current) => !current)}
          className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>
      <div hidden={!open} className="flex flex-col gap-3 border-t border-line px-4 py-3">
        {rows.map((row) => (
          <div key={row.key} className="grid gap-3 rounded-xl border border-line p-3 md:grid-cols-4">
            <input type="hidden" name={`${prefix}Id`} value={row.id} />
            <input type="hidden" name={`${prefix}Active`} value={row.active ? "1" : "0"} />
            <input
              name={`${prefix}Name`}
              value={row.name}
              onChange={(event) => update(row.key, { name: event.target.value })}
              placeholder={copy.fields.name}
              className={inputClassName}
              aria-label={copy.fields.name}
              dir="ltr"
            />
            <input
              name={`${prefix}NameAr`}
              value={row.nameAr}
              onChange={(event) => update(row.key, { nameAr: event.target.value })}
              placeholder={copy.fields.nameAr}
              className={inputClassName}
              aria-label={copy.fields.nameAr}
              dir="rtl"
            />
            <input
              name={`${prefix}Price`}
              value={row.price}
              onChange={(event) => update(row.key, { price: event.target.value })}
              inputMode="decimal"
              placeholder={copy.fields.price}
              className={inputClassName}
              aria-label={copy.fields.price}
            />
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={row.active} onCheckedChange={(checked) => update(row.key, { active: checked })} />
                {copy.fields.activeOption}
              </label>
              <button
                type="button"
                className="text-sm font-medium text-brand hover:text-brand-hover"
                onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
              >
                {copy.removeRow}
              </button>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
