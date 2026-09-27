"use client";

import { useEffect, useRef, useState } from "react";

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function parseYMD(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

export function DatePicker({
  id,
  value,
  min,
  max,
  onChange,
}: {
  id?: string;
  value: string;
  min: string;
  max: string;
  onChange: (dateStr: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = parseYMD(value);
  const minDate = parseYMD(min);
  const maxDate = parseYMD(max);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openPicker() {
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth());
    setOpen(true);
  }

  const firstOfMonth = startOfMonth(viewYear, viewMonth);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Montag = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];

  const canGoPrevMonth = startOfMonth(viewYear, viewMonth) > startOfMonth(minDate.getFullYear(), minDate.getMonth());
  const canGoNextMonth = startOfMonth(viewYear, viewMonth) < startOfMonth(maxDate.getFullYear(), maxDate.getMonth());

  const today = new Date();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 border-2 border-ink/20 rounded-xl px-4 py-3 bg-white focus:border-ocean focus:outline-none transition-colors text-left"
      >
        <span className="capitalize">
          {selected.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}
        </span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-4 h-4 shrink-0 text-ocean">
          <rect x="3.5" y="5" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-[300px] bg-white border-2 border-ink/10 rounded-xl shadow-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              disabled={!canGoPrevMonth}
              onClick={() => {
                const prev = new Date(viewYear, viewMonth - 1, 1);
                setViewYear(prev.getFullYear());
                setViewMonth(prev.getMonth());
              }}
              aria-label="Vorheriger Monat"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sky-mist disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="w-4 h-4 text-ink">
                <path d="M12.5 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="font-poster uppercase text-sm">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              disabled={!canGoNextMonth}
              onClick={() => {
                const next = new Date(viewYear, viewMonth + 1, 1);
                setViewYear(next.getFullYear());
                setViewMonth(next.getMonth());
              }}
              aria-label="Nächster Monat"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sky-mist disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="w-4 h-4 text-ink">
                <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w} className="text-[11px] font-semibold text-ink-muted py-1">
                {w}
              </span>
            ))}
            {cells.map((cell, i) => {
              if (!cell) return <span key={`empty-${i}`} />;
              const disabled = cell < minDate || cell > maxDate;
              const isSelected = isSameDay(cell, selected);
              const isToday = isSameDay(cell, today);
              return (
                <button
                  key={cell.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(formatYMD(cell));
                    setOpen(false);
                  }}
                  className={`w-9 h-9 mx-auto rounded-full text-sm flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-ocean text-white font-semibold"
                      : disabled
                        ? "text-ink-muted/40 cursor-not-allowed"
                        : `hover:bg-sky-mist ${isToday ? "border-2 border-ocean" : ""}`
                  }`}
                >
                  {cell.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
