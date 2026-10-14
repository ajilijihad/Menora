type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading / جارٍ التحميل" }: LoadingStateProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label={label}
      className="mx-auto flex w-full max-w-lg flex-col gap-4 px-6 py-16"
    >
      <span className="sr-only">{label}</span>
      <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-4/5 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
    </section>
  );
}
