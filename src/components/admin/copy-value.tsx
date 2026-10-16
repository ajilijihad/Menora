"use client";

import { Check, Clipboard } from "lucide-react";
import { useState } from "react";

export function CopyValue({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={copied ? copiedLabel : label}
      onClick={copy}
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" aria-hidden="true" /> : <Clipboard className="size-3.5" aria-hidden="true" />}
    </button>
  );
}
