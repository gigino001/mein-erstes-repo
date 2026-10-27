import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCalendarFeedIcs } from "@/lib/ics";

/**
 * Privater, mit einem geheimen Token geschützter Kalender-Feed zum
 * Abonnieren (webcal://…?token=…) in Claudias iPhone-Kalender — zeigt alle
 * bestätigten Termine sowie selbst gesetzte Blockierungen (Urlaub, private
 * Termine usw.). Kein Admin-Login, da Kalender-Apps keine Formular-Logins
 * unterstützen; stattdessen ein eigener, nur Claudia bekannter Token statt
 * der Admin-Session.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const expected = process.env.CALENDAR_FEED_TOKEN;

  if (!expected || !token || token !== expected) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const [appointments, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: { status: "confirmed" },
      include: { service: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.availabilityException.findMany({ orderBy: { date: "asc" } }),
  ]);

  const ics = buildCalendarFeedIcs(
    appointments.map((a) => ({
      id: a.id,
      startAt: a.startAt,
      endAt: a.endAt,
      serviceName: a.service.name,
      customerName: a.customerName,
      customerEmail: a.customerEmail,
    })),
    blocks.map((b) => ({
      id: b.id,
      date: b.date,
      allDay: b.allDay,
      startMinute: b.startMinute,
      endMinute: b.endMinute,
      reason: b.reason,
    })),
  );

  if (!ics) {
    return new NextResponse("Kalender konnte nicht erzeugt werden.", { status: 500 });
  }

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="termine-coco-lashes.ics"',
      "Cache-Control": "no-store",
    },
  });
}
