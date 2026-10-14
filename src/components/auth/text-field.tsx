type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "password" | "tel" | "url";
  autoComplete: string;
  error?: string;
  hint?: string;
  defaultValue?: string;
};

export function TextField({
  id,
  name,
  label,
  type,
  autoComplete,
  error,
  hint,
  defaultValue,
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="h-11 w-full rounded-lg border border-zinc-300 bg-transparent px-3 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:border-zinc-700"
      />
      {hint ? (
        <p id={hintId} className="text-sm text-zinc-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
