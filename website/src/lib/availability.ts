import { prisma } from "@/lib/prisma";

const SLOT_STEP_MINUTES = 30;

// Vereinfachung für den MVP: Termine werden in der Serverzeit gerechnet
// (Zielumgebung: Deutschland/Europe-Berlin auf ALL-INKL). Für mehrere
// Zeitzonen müsste hier eine echte TZ-Bibliothek rein.
function dateAtMinutes(dateStr: string, minutes: number): Date {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}

/** Gibt verfügbare Startzeiten (HH:mm) für ein Datum + eine Leistung zurück. */
export async function getAvailableSlots({
  staffId,
  dateStr,
  durationMinutes,
}: {
  staffId: string;
  dateStr: string;
  durationMinutes: number;
}): Promise<string[]> {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return [];

  const weekday = date.getDay();

  const [windows, exception, appointments] = await Promise.all([
    prisma.availability.findMany({ where: { staffId, weekday } }),
    prisma.availabilityException.findFirst({
      where: { staffId, date: { gte: date, lt: new Date(date.getTime() + 86400000) } },
    }),
    prisma.appointment.findMany({
      where: {
        staffId,
        status: { not: "cancelled" },
        startAt: { gte: date, lt: new Date(date.getTime() + 86400000) },
      },
    }),
  ]);

  if (exception?.allDay) return [];
  if (windows.length === 0) return [];

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const busyRanges = appointments.map((a) => {
    const start = (a.startAt.getHours() * 60) + a.startAt.getMinutes();
    const end = (a.endAt.getHours() * 60) + a.endAt.getMinutes();
    return { start, end };
  });

  if (exception && !exception.allDay && exception.startMinute != null && exception.endMinute != null) {
    busyRanges.push({ start: exception.startMinute, end: exception.endMinute });
  }

  const slots: string[] = [];
  for (const window of windows) {
    for (
      let start = window.startMinute;
      start + durationMinutes <= window.endMinute;
      start += SLOT_STEP_MINUTES
    ) {
      const end = start + durationMinutes;
      if (isToday && start <= nowMinutes) continue;
      if (busyRanges.some((b) => overlaps(start, end, b.start, b.end))) continue;
      const hh = String(Math.floor(start / 60)).padStart(2, "0");
      const mm = String(start % 60).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
}

export function slotToRange(dateStr: string, slot: string, durationMinutes: number) {
  const [h, m] = slot.split(":").map(Number);
  const startMinutes = h * 60 + m;
  const startAt = dateAtMinutes(dateStr, startMinutes);
  const endAt = dateAtMinutes(dateStr, startMinutes + durationMinutes);
  return { startAt, endAt };
}
