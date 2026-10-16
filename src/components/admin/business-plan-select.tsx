"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";

import { Select } from "@/components/ui/select";

type PlanOption = {
  value: string;
  label: string;
  href: string;
  logoUrl: string | null;
};

export function BusinessPlanSelect({
  value,
  options,
  label,
}: {
  value: string;
  options: PlanOption[];
  label: string;
}) {
  const router = useRouter();
  const current = options.find((option) => option.value === value) ?? options[0];

  function keepRow(event: MouseEvent | KeyboardEvent) {
    event.stopPropagation();
  }

  return (
    <div className="flex min-w-56 items-center gap-2.5" onClick={keepRow} onKeyDown={keepRow}>
      {current?.logoUrl ? <img src={current.logoUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" /> : null}
      <Select
        ariaLabel={label}
        value={current?.value}
        options={options.map((option) => ({ value: option.value, label: option.label }))}
        onValueChange={(next) => {
          const chosen = options.find((option) => option.value === next);
          if (chosen) {
            router.push(chosen.href);
          }
        }}
        className="h-10 w-56 rounded-xl border border-line bg-surface px-3 text-sm text-foreground"
      />
    </div>
  );
}
