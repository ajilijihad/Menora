"use client";

import { useId, useRef, type ReactNode } from "react";

type ConfirmFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  triggerLabel: string;
  fields: Record<string, string>;
};

export function ConfirmForm({
  action,
  title,
  description,
  confirmLabel,
  cancelLabel,
  triggerLabel,
  fields,
}: ConfirmFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        className="text-sm font-medium text-red-700 underline-offset-4 hover:underline dark:text-red-400"
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="w-[min(100%,28rem)] rounded-xl border border-zinc-200 p-0 text-inherit backdrop:bg-black/40 dark:border-zinc-700"
      >
        <form action={action} className="flex flex-col gap-4 p-5">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full bg-red-700 px-4 text-sm font-medium text-white"
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-700"
              onClick={() => dialogRef.current?.close()}
            >
              {cancelLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function HiddenFields({ fields }: { fields: Record<string, string> }): ReactNode {
  return Object.entries(fields).map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={value} />
  ));
}
