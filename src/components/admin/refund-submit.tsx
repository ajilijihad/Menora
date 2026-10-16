"use client";

import { RotateCcw } from "lucide-react";
import { useFormStatus } from "react-dom";

export function RefundSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-70"
    >
      <RotateCcw className={`size-4 ${pending ? "animate-spin" : ""}`} aria-hidden="true" />
      {label}
    </button>
  );
}
