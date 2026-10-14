"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function BillingRefresh({ label }: { label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground disabled:opacity-60"
    >
      <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} />
      {label}
    </button>
  );
}
