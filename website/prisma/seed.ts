import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Minuten seit Mitternacht, siehe schema.prisma
const OPENING_HOURS = [
  { weekday: 1, start: 10 * 60, end: 20 * 60 }, // Montag
  { weekday: 2, start: 10 * 60, end: 20 * 60 }, // Dienstag
  { weekday: 3, start: 10 * 60, end: 20 * 60 }, // Mittwoch
  { weekday: 4, start: 10 * 60, end: 20 * 60 }, // Donnerstag
  { weekday: 5, start: 10 * 60, end: 16 * 60 }, // Freitag
];

const SERVICES = [
  // Neumodellage
  { category: "neumodellage", name: "Neumodellage 1:1 (Classic)", durationMinutes: 90, priceCents: 8000, sortOrder: 1 },
  { category: "neumodellage", name: "Neumodellage Light Volumen", durationMinutes: 90, priceCents: 9000, sortOrder: 2 },
  { category: "neumodellage", name: "Neumodellage Mega Volumen", durationMinutes: 90, priceCents: 10000, sortOrder: 3 },
  { category: "neumodellage", name: "Bloom Eyes Neumodellage", description: "Wispy, Wet mit Farbe deiner Wahl. Für den extravaganten natürlichen Look.", durationMinutes: 120, priceCents: 9500, sortOrder: 4 },
  // Auffülltermine
  { category: "auffuellen", name: "Auffülltermin 1:1 (2-3 Wochen)", durationMinutes: 60, priceCents: 4000, sortOrder: 10 },
  { category: "auffuellen", name: "Auffülltermin 1:1 (3-4 Wochen)", durationMinutes: 60, priceCents: 5000, sortOrder: 11 },
  { category: "auffuellen", name: "Auffülltermin Light Volumen (2-3 Wochen)", durationMinutes: 60, priceCents: 5000, sortOrder: 12 },
  { category: "auffuellen", name: "Auffülltermin Light Volumen (3-4 Wochen)", durationMinutes: 60, priceCents: 6000, sortOrder: 13 },
  { category: "auffuellen", name: "Auffülltermin Mega Volumen (2-3 Wochen)", durationMinutes: 60, priceCents: 6000, sortOrder: 14 },
  { category: "auffuellen", name: "Auffülltermin Mega Volumen (3-4 Wochen)", durationMinutes: 60, priceCents: 7000, sortOrder: 15 },
  { category: "auffuellen", name: "Bloom Eyes Auffüllen (2-3 Wochen)", durationMinutes: 60, priceCents: 5500, sortOrder: 16 },
  { category: "auffuellen", name: "Bloom Eyes Auffüllen (3-4 Wochen)", durationMinutes: 60, priceCents: 6500, sortOrder: 17 },
  // Sonstiges
  { category: "sonstiges", name: "Wimpern entfernen", durationMinutes: 30, priceCents: 1000, sortOrder: 20 },
  { category: "sonstiges", name: "Modellarbeit", description: "Du hast eine Anzeige gesehen, dass Models gesucht werden? Buch dich gerne dafür ein.", durationMinutes: 120, priceCents: 5000, sortOrder: 21 },
];

async function main() {
  const claudia = await prisma.staff.upsert({
    where: { id: "staff-claudia" },
    update: {},
    create: { id: "staff-claudia", name: "Claudia Gajda", active: true },
  });

  for (const hours of OPENING_HOURS) {
    await prisma.availability.upsert({
      where: { id: `avail-${claudia.id}-${hours.weekday}` },
      update: { startMinute: hours.start, endMinute: hours.end },
      create: {
        id: `avail-${claudia.id}-${hours.weekday}`,
        staffId: claudia.id,
        weekday: hours.weekday,
        startMinute: hours.start,
        endMinute: hours.end,
      },
    });
  }

  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { id: `service-${service.sortOrder}` },
      update: service,
      create: { id: `service-${service.sortOrder}`, ...service },
    });
  }

  console.log(`Seed abgeschlossen: 1 Mitarbeiterin, ${OPENING_HOURS.length} Arbeitszeiten, ${SERVICES.length} Leistungen.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
