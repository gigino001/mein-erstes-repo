import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liefert alle ganztägig blockierten Tage (Urlaub, Feiertage etc.) für einen
 * Monat — damit der Buchungskalender sie direkt ausgrauen kann, statt dass
 * Kundinnen den Tag erst anklicken müssen, um zu sehen, dass nichts frei ist.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get("staffId");
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 1–12

  if (!staffId || !Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "staffId, year und month (1–12) sind erforderlich" }, { status: 400 });
  }

  const rangeStart = new Date(year, month - 1, 1);
  const rangeEnd = new Date(year, month, 1);

  const exceptions = await prisma.availabilityException.findMany({
    where: { staffId, allDay: true, date: { gte: rangeStart, lt: rangeEnd } },
    select: { date: true },
  });

  const dates = exceptions.map((e) => {
    const y = e.date.getFullYear();
    const m = String(e.date.getMonth() + 1).padStart(2, "0");
    const d = String(e.date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  return NextResponse.json({ dates });
}
