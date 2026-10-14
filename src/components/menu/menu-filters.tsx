"use client";

import type { FormEvent, ReactNode } from "react";

export function MenuFilters({ action, className, children }: { action: string; className?: string; children: ReactNode }) {
  return (
    <form
      action={action}
      className={className ?? "grid gap-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(10rem,0.7fr)_minmax(10rem,0.7fr)_auto]"}
      onChange={(event: FormEvent<HTMLFormElement>) => {
        if (event.target instanceof HTMLSelectElement) {
          event.currentTarget.requestSubmit();
        }
      }}
    >
      {children}
    </form>
  );
}
