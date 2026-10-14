"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CopyLinkProps = {
  value: string;
  label: string;
  copiedLabel: string;
};

export function CopyLink({ value, label, copiedLabel }: CopyLinkProps) {
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
      className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/25"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span className="max-w-40 truncate">{copied ? copiedLabel : label}</span>
    </button>
  );
}
