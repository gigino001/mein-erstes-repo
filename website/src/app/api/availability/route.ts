import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");
  const dateStr = searchParams.get("date");
  const staffId = searchParams.get("staffId");

  if (!serviceId || !dateStr || !staffId) {
    return NextResponse.json({ error: "serviceId, staffId und date sind erforderlich" }, { status: 400 });
  }

  try {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: "Leistung nicht gefunden" }, { status: 404 });
    }

    const slots = await getAvailableSlots({
      staffId,
      dateStr,
      durationMinutes: service.durationMinutes,
    });

    return NextResponse.json({ slots });
  } catch (error) {
    // TEMPORÄR zum Debuggen des 500-Fehlers auf Netlify — vor dem Live-Gang wieder entfernen.
    return NextResponse.json(
      { error: "debug", message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined },
      { status: 500 },
    );
  }
}
