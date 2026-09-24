import "server-only";
import { createEvent, type DateArray } from "ics";
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
