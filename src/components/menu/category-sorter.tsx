"use client";

import { GripVertical } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { reorderCategoriesAction } from "@/modules/menus/actions";

type CategorySorterProps = {
  locale: string;
  businessId: string;
  ids: string[];
  enabled: boolean;
  label: string;
  children: ReactNode[];
};

export function CategorySorter({ locale, businessId, ids, enabled, label, children }: CategorySorterProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const orderRef = useRef<HTMLInputElement>(null);
  const signature = ids.join(",");
  const [tracked, setTracked] = useState(signature);
  const [order, setOrder] = useState(ids);
  const [dragId, setDragId] = useState<string | null>(null);
  if (tracked !== signature) {
    setTracked(signature);
    setOrder(ids);
  }
  const rows = order
    .map((id) => ({ id, child: children[ids.indexOf(id)] }))
    .filter((row) => row.child);

  function dropOn(targetId: string) {
    if (!enabled || !dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const next = [...order];
    const from = next.indexOf(dragId);
    const to = next.indexOf(targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      return;
    }
    const [item] = next.splice(from, 1);
    if (!item) {
      return;
    }
    next.splice(to, 0, item);
    setOrder(next);
    setDragId(null);
    if (orderRef.current && formRef.current) {
      orderRef.current.value = next.join(",");
      formRef.current.requestSubmit();
    }
  }

  return (
    <>
      <form ref={formRef} action={reorderCategoriesAction} className="hidden">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="businessId" value={businessId} />
        <input ref={orderRef} type="hidden" name="order" defaultValue={ids.join(",")} />
      </form>
      <ul className="mt-4 flex flex-col">
        {rows.map((row) => (
          <li
            key={row.id}
            onDragOver={(event) => {
              if (enabled) event.preventDefault();
            }}
            onDrop={() => dropOn(row.id)}
            className={`flex items-center gap-3 border-t border-line px-1 py-3 ${dragId === row.id ? "opacity-60" : ""}`}
          >
            <button
              type="button"
              draggable={enabled}
              disabled={!enabled}
              aria-label={label}
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", row.id);
                event.dataTransfer.effectAllowed = "move";
                setDragId(row.id);
              }}
              onDragEnd={() => setDragId(null)}
              className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center text-muted disabled:cursor-default disabled:opacity-40"
            >
              <GripVertical className="size-4" aria-hidden="true" />
            </button>
            {row.child}
          </li>
        ))}
      </ul>
    </>
  );
}
