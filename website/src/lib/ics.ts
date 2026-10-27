import "server-only";
import { createEvent, createEvents, type DateArray } from "ics";
import { business, fullAddress } from "@/lib/business";

function toDateArray(d: Date): DateArray {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
}

/**
 * Baut eine .ics-Kalenderdatei für einen bestätigten Termin — kann in Apple
 * Kalender, Google Kalender, Outlook usw. importiert werden. Zeiten werden
 * bewusst ohne Zeitzonen-Angabe (floating time) erzeugt, siehe die gleiche
 * Vereinfachung in lib/availability.ts (Zielgruppe: lokal in Bielefeld).
 */
export function buildAppointmentIcs({
  id,
  startAt,
  endAt,
  serviceName,
  customerName,
  customerEmail,
}: {
  id: string;
  startAt: Date;
  endAt: Date;
  serviceName: string;
  customerName: string;
  customerEmail: string;
}): { filename: string; content: string } | null {
  const { error, value } = createEvent({
    uid: `${id}@${business.url.replace(/^https?:\/\//, "")}`,
    start: toDateArray(startAt),
    end: toDateArray(endAt),
    startInputType: "local",
    title: `${serviceName} — ${business.name}`,
    description: `Termin bei ${business.owner} (${business.name}).`,
    location: fullAddress,
    url: business.url,
    organizer: { name: business.name, email: business.email },
    attendees: [{ name: customerName, email: customerEmail, rsvp: false }],
    status: "CONFIRMED",
    busyStatus: "BUSY",
  });

  if (error || !value) {
    console.error("[ics] Konnte Kalenderdatei nicht erzeugen:", error);
    return null;
  }

  return { filename: "termin-coco-lashes.ics", content: value };
}

/**
 * Baut einen Kalender-Feed (mehrere VEVENTs in einer .ics-Datei) für Claudias
 * eigenes Abo im iPhone-Kalender (siehe /api/kalender/termine.ics). Enthält
 * bestätigte Termine und selbst gesetzte Blockierungen (Urlaub, private
 * Termine usw.) — wird ein Termin storniert oder eine Blockierung gelöscht,
 * verschwindet der jeweilige Eintrag beim nächsten automatischen Abgleich
 * des Abo-Kalenders von selbst, weil er dann nicht mehr im Feed auftaucht.
 */
export function buildCalendarFeedIcs(
  appointments: {
    id: string;
    startAt: Date;
    endAt: Date;
    serviceName: string;
    customerName: string;
    customerEmail: string;
  }[],
  blocks: {
    id: string;
    date: Date;
    allDay: boolean;
    startMinute: number | null;
    endMinute: number | null;
    reason: string | null;
  }[],
): string | null {
  const appointmentEvents = appointments.map((a) => ({
    uid: `${a.id}@${business.url.replace(/^https?:\/\//, "")}`,
    start: toDateArray(a.startAt),
    end: toDateArray(a.endAt),
    startInputType: "local" as const,
    title: `${a.serviceName} — ${a.customerName}`,
    description: `Termin mit ${a.customerName} (${a.customerEmail}).`,
    location: fullAddress,
    organizer: { name: business.name, email: business.email },
    status: "CONFIRMED" as const,
    busyStatus: "BUSY" as const,
  }));

  const blockEvents = blocks.map((b) => {
    const title = b.reason ? `Blockiert: ${b.reason}` : "Blockiert";
    const uid = `block-${b.id}@${business.url.replace(/^https?:\/\//, "")}`;

    if (b.allDay) {
      // DTEND ist bei ganztägigen Terminen exklusiv (der Folgetag), siehe
      // iCalendar-Spezifikation — sonst würde die ics-Bibliothek einen
      // zweitägigen Termin erzeugen.
      const nextDay = new Date(b.date);
      nextDay.setDate(nextDay.getDate() + 1);
      return {
        uid,
        start: [b.date.getFullYear(), b.date.getMonth() + 1, b.date.getDate()] as DateArray,
        end: [nextDay.getFullYear(), nextDay.getMonth() + 1, nextDay.getDate()] as DateArray,
        title,
        status: "CONFIRMED" as const,
        busyStatus: "BUSY" as const,
      };
    }

    const startAt = new Date(b.date);
    startAt.setMinutes(startAt.getMinutes() + (b.startMinute ?? 0));
    const endAt = new Date(b.date);
    endAt.setMinutes(endAt.getMinutes() + (b.endMinute ?? 0));

    return {
      uid,
      start: toDateArray(startAt),
      end: toDateArray(endAt),
      startInputType: "local" as const,
      title,
      status: "CONFIRMED" as const,
      busyStatus: "BUSY" as const,
    };
  });

  const { error, value } = createEvents([...appointmentEvents, ...blockEvents]);

  if (error || !value) {
    console.error("[ics] Konnte Kalender-Feed nicht erzeugen:", error);
    return null;
  }

  return value;
}
