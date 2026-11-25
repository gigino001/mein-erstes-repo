"use client";

import { useMemo, useState } from "react";
import { formatDuration, formatPrice } from "@/lib/format";
import { ConfirmCancelButtons } from "@/app/admin/(dashboard)/ConfirmCancelButtons";

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

type Appointment = {
  id: string;
  customerName: string;
  serviceName: string;
  durationMinutes: number;
  priceCents: number;
  depositAmountCents: number;
  startAt: string;
};

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function AppointmentCalendar({ appointments }: { appointments: Appointment[] }) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(formatYMD(today));

  const byDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const key = formatYMD(new Date(a.startAt));
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.startAt.localeCompare(b.startAt));
    return map;
  }, [appointments]);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Montag = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];

  function goToMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const selectedAppointments = byDate.get(selectedDate) ?? [];
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      <div className="w-full md:w-[340px] shrink-0 rounded-2xl border border-sky-mist p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Vorheriger Monat"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sky-mist transition-colors"
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
            onClick={() => goToMonth(1)}
            aria-label="Nächster Monat"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sky-mist transition-colors"
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
            const dateStr = formatYMD(cell);
            const dayAppointments = byDate.get(dateStr) ?? [];
            const isSelected = dateStr === selectedDate;
            const isToday = isSameDay(cell, today);
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                className={`relative w-9 h-9 mx-auto rounded-full text-sm flex items-center justify-center transition-colors ${
                  isSelected
                    ? "bg-ocean text-white font-semibold"
                    : `hover:bg-sky-mist ${isToday ? "border-2 border-ocean" : ""}`
                }`}
              >
                {cell.getDate()}
                {dayAppointments.length > 0 && (
                  <span
                    className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      isSelected ? "bg-white" : "bg-coral"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <h3 className="font-semibold">
          {selectedDateObj.toLocaleDateString("de-DE", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </h3>
        {selectedAppointments.length === 0 ? (
          <p className="text-sm text-ink-muted">Keine bestätigten Termine an diesem Tag.</p>
        ) : (
          <div className="flex flex-col divide-y divide-sky-mist">
            {selectedAppointments.map((a) => (
              <div key={a.id} className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold">
                    {formatTime(a.startAt)} · {a.customerName} — {a.serviceName}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {formatDuration(a.durationMinutes)} · {formatPrice(a.priceCents)}
                    {a.depositAmountCents > 0 && (
                      <span className="text-ocean font-semibold">
                        {" "}
                        · {formatPrice(a.depositAmountCents)} Anzahlung bezahlt
                      </span>
                    )}
                  </p>
                </div>
                <ConfirmCancelButtons id={a.id} showConfirm={false} hasDeposit={a.depositAmountCents > 0} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
