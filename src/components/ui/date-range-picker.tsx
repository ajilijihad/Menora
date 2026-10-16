"use client";

import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { isWithinBounds, monthGrid, monthOf, shiftMonth, weekStartsOn } from "@/lib/calendar/month";
import type { Locale } from "@/lib/i18n/locales";

export type CalendarLabels = {
  clear: string;
  today: string;
  previousMonth: string;
  nextMonth: string;
  chooseMonth: string;
};

type DateRangePickerProps = {
  locale: Locale;
  fromLabel: string;
  toLabel: string;
  from: string;
  to: string;
  today: string;
  min?: string;
  max?: string;
  required?: boolean;
  applyLabel: string;
  labels: CalendarLabels;
};

const fieldClassName =
  "flex h-11 w-full items-center gap-2 rounded-xl border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function DateRangePicker({
  locale,
  fromLabel,
  toLabel,
  from,
  to,
  today,
  min,
  max,
  required = false,
  applyLabel,
  labels,
}: DateRangePickerProps) {
  const dialogId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const fromButtonRef = useRef<HTMLButtonElement>(null);
  const toButtonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<"from" | "to">("from");
  const [committedFrom, setCommittedFrom] = useState(from);
  const [committedTo, setCommittedTo] = useState(to);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [cursor, setCursor] = useState(monthOf(from || today));
  const baselineFrom = useRef(from);
  const baselineTo = useRef(to);
  const weekStart = weekStartsOn(locale);
  const localeTag = locale === "ar" ? "ar" : "en-US";
  const canApply = Boolean(draftFrom && draftTo && draftFrom <= draftTo && isWithinBounds(draftFrom, min, max) && isWithinBounds(draftTo, min, max));
  const todayAllowed = isWithinBounds(today, min, max);

  const focusField = useCallback(() => {
    (active === "from" ? fromButtonRef : toButtonRef).current?.focus();
  }, [active]);

  const cancel = useCallback(() => {
    setDraftFrom(baselineFrom.current);
    setDraftTo(baselineTo.current);
    setCommittedFrom(baselineFrom.current);
    setCommittedTo(baselineTo.current);
    setOpen(false);
    focusField();
  }, [focusField]);

  const closeKeeping = useCallback(() => {
    setOpen(false);
    focusField();
  }, [focusField]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeKeeping();
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        cancel();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, cancel, closeKeeping]);

  function store(nextFrom: string, nextTo: string) {
    setDraftFrom(nextFrom);
    setDraftTo(nextTo);
    if (nextFrom && nextTo && nextFrom <= nextTo && isWithinBounds(nextFrom, min, max) && isWithinBounds(nextTo, min, max)) {
      setCommittedFrom(nextFrom);
      setCommittedTo(nextTo);
    }
  }

  function openField(field: "from" | "to") {
    baselineFrom.current = committedFrom;
    baselineTo.current = committedTo;
    setActive(field);
    setDraftFrom(committedFrom);
    setDraftTo(committedTo);
    setCursor(monthOf((field === "from" ? committedFrom : committedTo) || committedFrom || today));
    setOpen(true);
  }

  function pick(day: string) {
    if (!isWithinBounds(day, min, max)) {
      return;
    }
    if (!draftFrom || draftTo) {
      setDraftFrom(day);
      setDraftTo("");
      setActive("to");
      return;
    }
    if (day < draftFrom) {
      store(day, draftFrom);
    } else {
      store(draftFrom, day);
    }
    setActive("to");
  }

  function applyDraft() {
    if (!canApply) {
      return;
    }
    setCommittedFrom(draftFrom);
    setCommittedTo(draftTo);
    setOpen(false);
    fromButtonRef.current?.focus();
  }

  function selectToday() {
    if (!todayAllowed) {
      return;
    }
    if (active === "to" && draftFrom && draftFrom <= today) {
      store(draftFrom, today);
      return;
    }
    store(today, today);
    setCursor(monthOf(today));
    setActive("to");
  }

  function onGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const key = event.key;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key)) {
      return;
    }
    const current = event.target;
    if (!(current instanceof HTMLButtonElement) || !current.dataset.day) {
      return;
    }
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-in-month]:not(:disabled)")];
    const index = buttons.indexOf(current);
    if (index < 0) {
      return;
    }
    const rtl = document.documentElement.dir === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const backward = rtl ? "ArrowRight" : "ArrowLeft";
    const delta = key === "ArrowDown" ? 7 : key === "ArrowUp" ? -7 : key === forward ? 1 : key === backward ? -1 : 0;
    const next = buttons[index + delta];
    if (!next) {
      return;
    }
    event.preventDefault();
    next.focus();
  }

  const shownFrom = open ? draftFrom : committedFrom;
  const shownTo = open ? draftTo : committedTo;

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name="from" value={committedFrom} required={required} />
      <input type="hidden" name="to" value={committedTo} required={required} />
      <div className="flex flex-wrap items-end gap-2">
        <Field
          buttonRef={fromButtonRef}
          label={fromLabel}
          value={shownFrom}
          localeTag={localeTag}
          highlighted={open && active === "from"}
          controls={dialogId}
          expanded={open}
          onClick={() => openField("from")}
        />
        <Field
          buttonRef={toButtonRef}
          label={toLabel}
          value={shownTo}
          localeTag={localeTag}
          highlighted={open && active === "to"}
          controls={dialogId}
          expanded={open}
          onClick={() => openField("to")}
        />
      </div>
      {open ? (
        <div
          id={dialogId}
          role="dialog"
          aria-label={`${fromLabel} – ${toLabel}`}
          onKeyDown={onGridKeyDown}
          className="absolute start-0 top-full z-50 mt-2 w-[min(42rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-3 text-foreground shadow-[0_8px_30px_rgba(15,23,42,0.08)] sm:start-auto sm:end-0 sm:p-4 dark:shadow-none"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <MonthPane
              monthStart={cursor}
              weekStart={weekStart}
              localeTag={localeTag}
              labels={labels}
              draftFrom={draftFrom}
              draftTo={draftTo}
              min={min}
              max={max}
              showPrevious
              showNext={false}
              onShift={(amount) => setCursor(shiftMonth(cursor, amount))}
              onMonth={(next) => setCursor(next)}
              onPick={pick}
            />
            <MonthPane
              monthStart={shiftMonth(cursor, 1)}
              weekStart={weekStart}
              localeTag={localeTag}
              labels={labels}
              draftFrom={draftFrom}
              draftTo={draftTo}
              min={min}
              max={max}
              showPrevious={false}
              showNext
              className="hidden border-s border-line ps-4 sm:block"
              onShift={(amount) => setCursor(shiftMonth(cursor, amount))}
              onMonth={(next) => setCursor(shiftMonth(next, -1))}
              onPick={pick}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3 sm:hidden">
            <button type="button" aria-label={labels.previousMonth} onClick={() => setCursor(shiftMonth(cursor, -1))} className={iconButtonClassName}>
              <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            </button>
            <button type="button" aria-label={labels.nextMonth} onClick={() => setCursor(shiftMonth(cursor, 1))} className={iconButtonClassName}>
              <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
            <button type="button" onClick={() => { setDraftFrom(""); setDraftTo(""); setCommittedFrom(baselineFrom.current); setCommittedTo(baselineTo.current); setActive("from"); }} className={quietButtonClassName}>
              {labels.clear}
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={selectToday} disabled={!todayAllowed} className={quietButtonClassName}>
                {labels.today}
              </button>
              <button type="button" onClick={applyDraft} disabled={!canApply} className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50">
                {applyLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const iconButtonClassName =
  "inline-flex size-9 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const quietButtonClassName =
  "inline-flex h-10 items-center rounded-xl border border-line bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40";

function Field({
  buttonRef,
  label,
  value,
  localeTag,
  highlighted,
  controls,
  expanded,
  onClick,
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  label: string;
  value: string;
  localeTag: string;
  highlighted: boolean;
  controls: string;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <label className="flex w-full min-w-40 flex-col gap-1 text-xs font-medium text-muted sm:w-44">
      {label}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={expanded}
        aria-controls={controls}
        onClick={onClick}
        className={`${fieldClassName} ${highlighted ? "border-brand ring-2 ring-brand/15" : "border-line"}`}
      >
        <Calendar className="size-4 shrink-0 text-muted" aria-hidden="true" />
        <span className={value ? "text-foreground" : "text-muted"}>{value ? formatDay(value, localeTag) : "—"}</span>
      </button>
    </label>
  );
}

function MonthPane({
  monthStart,
  weekStart,
  localeTag,
  labels,
  draftFrom,
  draftTo,
  min,
  max,
  showPrevious,
  showNext,
  className = "",
  onShift,
  onMonth,
  onPick,
}: {
  monthStart: string;
  weekStart: number;
  localeTag: string;
  labels: CalendarLabels;
  draftFrom: string;
  draftTo: string;
  min?: string;
  max?: string;
  showPrevious: boolean;
  showNext: boolean;
  className?: string;
  onShift: (amount: number) => void;
  onMonth: (monthStart: string) => void;
  onPick: (day: string) => void;
}) {
  const [year, month] = monthStart.split("-").map(Number);
  const [choosingMonth, setChoosingMonth] = useState(false);
  const days = monthGrid(monthStart, weekStart);
  const monthKey = monthStart.slice(0, 7);
  const weekdays = weekdayLabels(localeTag, weekStart);
  const start = draftFrom && draftTo && draftFrom <= draftTo ? draftFrom : "";
  const end = draftFrom && draftTo && draftFrom <= draftTo ? draftTo : "";

  return (
    <section className={className}>
      <div className="mb-3 grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center">
        {showPrevious ? (
          <button type="button" aria-label={labels.previousMonth} onClick={() => onShift(-1)} className={`${iconButtonClassName} hidden sm:inline-flex`}>
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        ) : (
          <span />
        )}
        <div className="relative flex justify-center">
          <button
            type="button"
            aria-label={labels.chooseMonth}
            aria-expanded={choosingMonth}
            onClick={() => setChoosingMonth((open) => !open)}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {monthName(year, month - 1, localeTag)} {year}
            <ChevronDown className="size-3.5 text-muted" aria-hidden="true" />
          </button>
          {choosingMonth ? (
            <div className="absolute top-10 z-10 grid w-56 grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-card)]">
              {Array.from({ length: 12 }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-current={index === month - 1 ? "true" : undefined}
                  onClick={() => {
                    const nextMonth = String(index + 1).padStart(2, "0");
                    onMonth(`${year}-${nextMonth}-01`);
                    setChoosingMonth(false);
                  }}
                  className={`rounded-lg px-2 py-1.5 text-sm hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${index === month - 1 ? "bg-brand/10 font-medium text-brand" : "text-foreground"}`}
                >
                  {monthName(year, index, localeTag)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {showNext ? (
          <button type="button" aria-label={labels.nextMonth} onClick={() => onShift(1)} className={`${iconButtonClassName} hidden justify-self-end sm:inline-flex`}>
            <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        ) : (
          <span />
        )}
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted">
        {weekdays.map((label, index) => (
          <span key={`${label}-${index}`} className="flex h-8 items-center justify-center">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = day.startsWith(monthKey);
          const disabled = !isWithinBounds(day, min, max);
          const selected = day === draftFrom || day === draftTo || (start !== "" && (day === start || day === end));
          const between = start !== "" && day > start && day < end;
          return (
            <button
              key={day}
              type="button"
              data-day={day}
              data-in-month={inMonth ? "" : undefined}
              disabled={disabled}
              aria-pressed={selected}
              aria-label={formatDay(day, localeTag, "long")}
              onClick={() => onPick(day)}
              className="relative flex h-10 items-center justify-center text-sm focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-35"
            >
              {between ? <span className="absolute inset-y-1 inset-x-0 bg-brand/10" aria-hidden="true" /> : null}
              {start !== "" && day === start && start !== end ? <span className="absolute inset-y-1 start-1/2 end-0 bg-brand/10" aria-hidden="true" /> : null}
              {end !== "" && day === end && start !== end ? <span className="absolute inset-y-1 start-0 end-1/2 bg-brand/10" aria-hidden="true" /> : null}
              <span
                className={`relative z-10 flex size-8 items-center justify-center rounded-lg ${
                  selected ? "bg-brand font-semibold text-white" : inMonth ? "text-foreground hover:bg-surface-muted" : "text-muted/70"
                }`}
              >
                {formatDay(day, localeTag, "day")}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function weekdayLabels(localeTag: string, weekStart: number): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(Date.UTC(2024, 0, 7 + ((weekStart + index) % 7)));
    return new Intl.DateTimeFormat(localeTag, { weekday: "short", timeZone: "UTC" }).format(day);
  });
}

function monthName(year: number, monthIndex: number, localeTag: string): string {
  return new Intl.DateTimeFormat(localeTag, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

function formatDay(iso: string, localeTag: string, style: "short" | "long" | "day" = "short"): string {
  const [year, month, day] = iso.split("-").map(Number);
  const options: Intl.DateTimeFormatOptions =
    style === "day"
      ? { day: "numeric", timeZone: "UTC" }
      : { month: style === "long" ? "long" : "2-digit", day: style === "long" ? "numeric" : "2-digit", year: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat(localeTag, options).format(new Date(Date.UTC(year, month - 1, day)));
}
