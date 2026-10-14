"use client";

import { useState } from "react";

import type { MenuCopy } from "@/lib/i18n/menu-copy";

export type OptionDraft = {
  key: string;
  id: string;
  name: string;
  nameAr: string;
  price: string;
  active: boolean;
};

const inputClassName =
  "h-10 w-full rounded-lg border border-zinc-300 bg-transparent px-3 text-sm dark:border-zinc-700";

type OptionEditorProps = {
  copy: MenuCopy;
  prefix: "variant" | "addon";
  legend: string;
  initial: OptionDraft[];
};

export function OptionEditor({ copy, prefix, legend, initial }: OptionEditorProps) {
  const [rows, setRows] = useState<OptionDraft[]>(initial);

  function update(key: string, patch: Partial<OptionDraft>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">{legend}</legend>
      {rows.map((row) => (
        <div key={row.key} className="grid gap-3 rounded-lg border border-zinc-200 p-3 md:grid-cols-4 dark:border-zinc-800">
          <input type="hidden" name={`${prefix}Id`} value={row.id} />
          <input type="hidden" name={`${prefix}Active`} value={row.active ? "1" : "0"} />
          <input
            name={`${prefix}Name`}
            value={row.name}
            onChange={(event) => update(row.key, { name: event.target.value })}
            placeholder={copy.fields.name}
            className={inputClassName}
            aria-label={copy.fields.name}
          />
          <input
            name={`${prefix}NameAr`}
            value={row.nameAr}
            onChange={(event) => update(row.key, { nameAr: event.target.value })}
            placeholder={copy.fields.nameAr}
            className={inputClassName}
            aria-label={copy.fields.nameAr}
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
              <input
                type="checkbox"
                checked={row.active}
                onChange={(event) => update(row.key, { active: event.target.checked })}
              />
              {copy.fields.activeOption}
            </label>
            <button
              type="button"
              className="text-sm underline-offset-4 hover:underline"
              onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
            >
              {copy.removeRow}
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="self-start text-sm font-medium underline-offset-4 hover:underline"
        onClick={() =>
          setRows((current) => [
            ...current,
            { key: crypto.randomUUID(), id: "", name: "", nameAr: "", price: "", active: true },
          ])
        }
      >
        {copy.addRow}
      </button>
    </fieldset>
  );
}
