"use client";

import { useMemo, useState } from "react";
import { formatDuration, formatPrice } from "@/lib/format";
import { ConfirmCancelButtons } from "@/app/admin/(dashboard)/ConfirmCancelButtons";
import { DeleteBlockButton } from "@/app/admin/(dashboard)/blockieren/DeleteBlockButton";

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

type Block = {
  id: string;
  date: string;
  allDay: boolean;
  startMinute: number | null;
  endMinute: number | null;
  reason: string | null;
};

function formatBlockTime(minutes: number) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

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

export function AppointmentCalendar({
  appointments,
  blocks,
}: {
  appointments: Appointment[];
  blocks: Block[];
}) {
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

  const blocksByDate = useMemo(() => {
    const map = new Map<string, Block[]>();
    for (const b of blocks) {
      const key = formatYMD(new Date(b.date));
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    return map;
  }, [blocks]);

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
  const selectedBlocks = blocksByDate.get(selectedDate) ?? [];
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
            const dayBlocks = blocksByDate.get(dateStr) ?? [];
            const isAllDayBlocked = dayBlocks.some((b) => b.allDay);
            const isSelected = dateStr === selectedDate;
            const isToday = isSameDay(cell, today);
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                title={isAllDayBlocked ? "Blockiert" : undefined}
                className={`relative w-9 h-9 mx-auto rounded-full text-sm flex items-center justify-center transition-colors ${
                  isSelected
                    ? "bg-ocean text-white font-semibold"
                    : `hover:bg-sky-mist ${isToday ? "border-2 border-ocean" : ""} ${
                        isAllDayBlocked ? "line-through text-ink-muted/60" : ""
                      }`
                }`}
              >
                {cell.getDate()}
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {dayAppointments.length > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-coral"}`} />
                  )}
                  {dayBlocks.length > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-ink-muted"}`} />
                  )}
                </span>
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
        {selectedBlocks.length > 0 && (
          <div className="flex flex-col gap-3">
            {selectedBlocks.map((b) => (
              <div
                key={b.id}
                className="rounded-xl bg-sky-mist/60 px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
              >
                <p className="text-sm font-semibold text-ink-soft">
                  {b.allDay
                    ? "Ganztägig blockiert"
                    : `Blockiert ${formatBlockTime(b.startMinute ?? 0)}–${formatBlockTime(b.endMinute ?? 0)}`}
                  {b.reason && ` · ${b.reason}`}
                </p>
                <DeleteBlockButton id={b.id} />
              </div>
            ))}
          </div>
        )}

        {selectedAppointments.length === 0 ? (
          selectedBlocks.length === 0 && (
            <p className="text-sm text-ink-muted">Keine bestätigten Termine an diesem Tag.</p>
          )
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
