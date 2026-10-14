import type { ReactNode } from "react";

type NoticeProps = {
  tone: "error" | "success";
  children: ReactNode;
};

export function Notice({ tone, children }: NoticeProps) {
  const className =
    tone === "error"
      ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      : "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";

  return (
    <p role={tone === "error" ? "alert" : "status"} className={className}>
      {children}
    </p>
  );
}
