"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

export function PendingSubmit({
  idle,
  pending,
  className,
}: {
  idle: string;
  pending: string;
  className: string;
}) {
  const status = useFormStatus();

  return (
    <button type="submit" disabled={status.pending} className={className}>
      {status.pending ? pending : idle}
    </button>
  );
}

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

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        });
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-surface-muted"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-muted" />}
      {copied ? copiedLabel : label}
    </button>
  );
}
