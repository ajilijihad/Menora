"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  id?: string;
  name?: string;
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  leading?: ReactNode;
  searchable?: boolean;
  submitOnChange?: boolean;
};

const searchThreshold = 10;

function firstEnabled(options: readonly SelectOption[]) {
  return options.find((option) => !option.disabled)?.value ?? "";
}

function matches(option: SelectOption, query: string) {
  const needle = query.trim().toLowerCase().replaceAll("_", " ").replaceAll("/", " ");
  if (!needle) return true;
  const haystack = `${option.label} ${option.value}`.toLowerCase().replaceAll("_", " ").replaceAll("/", " ");
  return haystack.includes(needle);
}

export function Select({
  id,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  required = false,
  disabled = false,
  placeholder = "",
  ariaLabel,
  className,
  leading,
  searchable,
  submitOnChange = false,
}: SelectProps) {
  const generatedId = useId();
  const listId = `${generatedId}-list`;
  const searchId = `${generatedId}-search`;
  const fullWidth = Boolean(className?.includes("w-full")) && !/\bw-\d/.test(className ?? "");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const pendingNotify = useRef(false);
  const [internal, setInternal] = useState(() => (defaultValue !== undefined ? defaultValue : firstEnabled(options)));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const current = value !== undefined ? value : internal;
  const canSearch = searchable ?? options.length >= searchThreshold;
  const filtered = canSearch ? options.filter((option) => matches(option, query)) : options;
  const selected = options.find((option) => option.value === current);
  const display = selected?.label || placeholder || current;

  useEffect(() => {
    if (!pendingNotify.current) return;
    pendingNotify.current = false;
    if (submitOnChange) {
      valueRef.current?.form?.requestSubmit();
    }
  }, [current, submitOnChange]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !canSearch) return;
    const field = document.getElementById(searchId);
    if (field instanceof HTMLInputElement) field.focus({ preventScroll: true });
  }, [open, canSearch, searchId]);

  useEffect(() => {
    if (!open) return;
    const node = document.getElementById(`${listId}-${active}`);
    const parent = node?.parentElement;
    if (!node || !parent) return;
    const top = node.offsetTop;
    const bottom = top + node.offsetHeight;
    if (top < parent.scrollTop) parent.scrollTop = top;
    else if (bottom > parent.scrollTop + parent.clientHeight) parent.scrollTop = bottom - parent.clientHeight;
  }, [open, active, listId]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const trigger = buttonRef.current;
    if (!panel || !trigger) return;

    function place() {
      const currentPanel = panelRef.current;
      const currentTrigger = buttonRef.current;
      if (!currentPanel || !currentTrigger) return;
      const rect = currentTrigger.getBoundingClientRect();
      const margin = 8;
      const width = Math.min(Math.max(rect.width, canSearch ? 220 : rect.width), window.innerWidth - margin * 2);
      const rtl = getComputedStyle(currentTrigger).direction === "rtl";
      let left = rtl ? rect.right - width : rect.left;
      left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
      const height = Math.min(currentPanel.scrollHeight, 320);
      const openUp = window.innerHeight - rect.bottom < height + margin && rect.top > window.innerHeight - rect.bottom;
      currentPanel.style.width = `${width}px`;
      currentPanel.style.left = `${left}px`;
      if (openUp) {
        currentPanel.style.top = "auto";
        currentPanel.style.bottom = `${window.innerHeight - rect.top + 4}px`;
      } else {
        currentPanel.style.bottom = "auto";
        currentPanel.style.top = `${rect.bottom + 4}px`;
      }
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, canSearch, filtered.length, query]);

  function commit(next: string) {
    const option = options.find((item) => item.value === next);
    if (!option || option.disabled || disabled) return;
    pendingNotify.current = true;
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
    setOpen(false);
    setQuery("");
    buttonRef.current?.focus();
  }

  function openList() {
    if (disabled) return;
    const index = Math.max(0, filtered.findIndex((option) => option.value === current && !option.disabled));
    setActive(index === -1 ? 0 : index);
    setQuery("");
    setOpen(true);
  }

  function move(from: number, direction: 1 | -1) {
    if (filtered.length === 0) return from;
    let index = from;
    for (let step = 0; step < filtered.length; step += 1) {
      index = (index + direction + filtered.length) % filtered.length;
      if (!filtered[index]?.disabled) return index;
    }
    return from;
  }

  function onButtonKey(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) openList();
      else if (event.key === "ArrowDown") setActive((index) => move(index, 1));
      else if (event.key === "ArrowUp") setActive((index) => move(index, -1));
      else if (event.key === "Enter" || event.key === " ") {
        const option = filtered[active];
        if (option) commit(option.value);
      }
    }
  }

  function onSearchKey(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => move(index, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => move(index, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[active];
      if (option && !option.disabled) commit(option.value);
    }
  }

  const searchLabel = typeof document !== "undefined" && document.documentElement.lang.startsWith("ar") ? "بحث" : "Search";
  const emptyLabel = typeof document !== "undefined" && document.documentElement.lang.startsWith("ar") ? "لا توجد نتائج" : "No matches";

  const panel = open ? (
    <div
      ref={panelRef}
      id={listId}
      role="listbox"
      aria-labelledby={id}
      className="fixed z-[80] overflow-hidden rounded-xl border border-line bg-surface text-foreground shadow-[var(--shadow-card)]"
      style={{ top: -9999, left: 0 }}
    >
      {canSearch ? (
        <div className="border-b border-line p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id={searchId}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKey}
              placeholder={searchLabel}
              aria-label={searchLabel}
              autoComplete="off"
              className="h-9 w-full rounded-lg border border-line bg-surface ps-8 pe-2 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            />
          </div>
        </div>
      ) : null}
      <div className="max-h-60 overflow-y-auto p-1">
        {filtered.length === 0 ? <p className="px-3 py-2 text-sm text-muted">{emptyLabel}</p> : null}
        {filtered.map((option, index) => {
          const chosen = option.value === current;
          return (
            <button
              key={`${option.value}-${index}`}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              aria-selected={chosen}
              disabled={option.disabled}
              onMouseEnter={() => setActive(index)}
              onClick={() => commit(option.value)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40 ${chosen ? "bg-orange-500/10 font-medium text-brand" : "hover:bg-surface-muted"} ${index === active && !chosen ? "bg-surface-muted" : ""}`}
            >
              <span dir="auto" className="min-w-0 flex-1 truncate">{option.label}</span>
              {chosen ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={fullWidth ? "relative w-full min-w-0" : "relative inline-flex max-w-full min-w-0"}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onButtonKey}
        className={`inline-flex items-center gap-2 text-start disabled:cursor-not-allowed disabled:opacity-60 ${className ?? "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-foreground"}`}
      >
        {leading}
        <span dir="auto" className={`min-w-0 flex-1 truncate ${selected && !selected.disabled ? "" : "text-muted"}`}>{display}</span>
        <ChevronDown className={`size-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {name ? (
        <input
          ref={valueRef}
          tabIndex={-1}
          name={name}
          value={current}
          required={required}
          disabled={disabled}
          autoComplete="off"
          aria-hidden="true"
          data-select-value=""
          onChange={() => undefined}
          onFocus={() => buttonRef.current?.focus()}
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      ) : null}
      {panel && typeof document !== "undefined" ? createPortal(panel, document.body) : null}
    </div>
  );
}
