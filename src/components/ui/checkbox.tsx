"use client";

import { Check } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

type CheckboxProps = {
  id?: string;
  name?: string;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  indeterminate?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  error?: string;
  ariaLabel?: string;
  describedBy?: string;
  visuallyHidden?: boolean;
  className?: string;
};

const boxClassName =
  "peer col-start-1 row-start-1 size-5 cursor-pointer appearance-none rounded-md border border-line bg-surface transition checked:border-brand checked:bg-brand indeterminate:border-brand indeterminate:bg-brand hover:border-brand/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-muted disabled:hover:border-line aria-invalid:border-red-600";

export function Checkbox({
  id,
  name,
  value,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
  required = false,
  indeterminate = false,
  label,
  description,
  error,
  ariaLabel,
  describedBy,
  visuallyHidden = false,
  className,
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const described = [describedBy, descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const onCheckedChangeRef = useRef(onCheckedChange);
  const controlled = checked !== undefined;
  onCheckedChangeRef.current = onCheckedChange;

  useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.indeterminate = indeterminate;
  }, [indeterminate]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    // A click on a checkbox nested in a label is delivered twice. Stopping it
    // on the input keeps one toggle for both direct clicks and label clicks.
    const handleClick = (event: MouseEvent) => {
      event.stopPropagation();
      onCheckedChangeRef.current?.(input.checked);
    };
    input.addEventListener("click", handleClick);
    return () => input.removeEventListener("click", handleClick);
  }, []);

  const box = visuallyHidden ? (
    <input
      ref={inputRef}
      id={id}
      type="checkbox"
      name={name}
      value={value}
      checked={controlled ? checked : undefined}
      defaultChecked={controlled ? undefined : defaultChecked}
      onChange={(event) => onCheckedChangeRef.current?.(event.target.checked)}
      disabled={disabled}
      required={required}
      aria-label={ariaLabel}
      aria-invalid={error ? true : undefined}
      aria-describedby={described}
      className="sr-only"
    />
  ) : (
    <span className={`relative grid size-5 shrink-0 ${disabled ? "opacity-60" : ""} ${label || description || error ? "mt-0.5" : className ?? ""}`}>
      <input
        ref={inputRef}
        id={label || description || error ? inputId : id}
        type="checkbox"
        name={name}
        value={value}
        checked={controlled ? checked : undefined}
        defaultChecked={controlled ? undefined : defaultChecked}
        onChange={(event) => onCheckedChangeRef.current?.(event.target.checked)}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={described}
        className={boxClassName}
      />
      <Check className="pointer-events-none col-start-1 row-start-1 size-3.5 place-self-center text-white opacity-0 transition-opacity peer-checked:opacity-100 peer-indeterminate:opacity-0" aria-hidden="true" />
      <span className="pointer-events-none col-start-1 row-start-1 h-0.5 w-2.5 place-self-center rounded-full bg-white opacity-0 peer-indeterminate:opacity-100" aria-hidden="true" />
    </span>
  );

  if (!label && !description && !error) {
    return box;
  }

  return (
    <label className={`flex items-start gap-3 ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${className ?? ""}`}>
      {box}
      <span className="min-w-0">
        {label ? <span className={`block text-sm font-medium ${disabled ? "text-muted" : "text-foreground"}`}>{label}</span> : null}
        {description ? <span id={descriptionId} className="mt-0.5 block text-xs text-muted">{description}</span> : null}
        {error ? <span id={errorId} className="mt-1 block text-sm text-red-600 dark:text-red-300">{error}</span> : null}
      </span>
    </label>
  );
}
