"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, ReactNode } from "react";

export function UserSelectRow({
  href,
  selected,
  children,
}: {
  href: string;
  selected: boolean;
  children: ReactNode;
}) {
  const router = useRouter();

  function open() {
    router.push(href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  }

  return (
    <tr
      tabIndex={0}
      aria-selected={selected}
      onClick={open}
      onKeyDown={onKeyDown}
      className={`cursor-pointer border-b border-line align-top transition-colors last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand ${
        selected ? "bg-brand/[0.06]" : "hover:bg-surface-muted/70"
      }`}
    >
      {children}
    </tr>
  );
}
