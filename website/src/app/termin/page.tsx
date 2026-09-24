import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/BookingForm";

export const metadata: Metadata = {
  title: "Termin buchen",
  description: "Frage jetzt unverbindlich deinen Wunschtermin bei coco lashes in Bielefeld an.",
};

export default async function TerminPage() {
  const [services, staff] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.staff.findFirst({ where: { active: true } }),
  ]);

  if (!staff) {
    return (
      <div className="px-6 md:px-18 py-20 max-w-xl mx-auto text-center text-ink-muted">
        Die Terminbuchung ist gerade nicht verfügbar. Bitte kontaktiere uns direkt.
      </div>
    );
  }

  return (
    <div className="px-6 md:px-18 py-20 max-w-xl mx-auto flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Termin buchen
        </span>
        <h1 className="font-poster uppercase text-5xl">Termin</h1>
        <p className="text-ink-soft">
          Wähle deine Wunschleistung, ein freies Datum und eine Uhrzeit — ich bestätige deine
          Anfrage anschließend persönlich.
        </p>
      </div>
      <BookingForm services={services} staffId={staff.id} />
    </div>
  );
}
