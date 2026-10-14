"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background print:hidden"
    >
      {label}
    </button>
  );
}
