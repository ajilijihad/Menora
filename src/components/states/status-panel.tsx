import type { ReactNode } from "react";

type StatusPanelProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export const statusActionClassName =
  "inline-flex h-10 items-center justify-center rounded-full bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function StatusPanel({ title, description, children }: StatusPanelProps) {
  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-3 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      {children ? <div className="mt-3 flex flex-wrap gap-3">{children}</div> : null}
    </section>
  );
}
