import { prisma } from "@/lib/prisma";
import { KontakteManager } from "@/app/admin/(dashboard)/kontakte/KontakteManager";

export default async function KontaktePage() {
  const appointments = await prisma.appointment.findMany({
    orderBy: { startAt: "desc" },
    select: { customerName: true, customerEmail: true, startAt: true },
  });

  // Pro E-Mail-Adresse zusammenfassen — Name und Datum der ersten Zeile
  // (wegen orderBy desc der jeweils letzte Termin) gewinnen.
  const byEmail = new Map<
    string,
    { name: string; email: string; lastAppointment: Date; appointmentCount: number }
  >();
  for (const a of appointments) {
    const key = a.customerEmail.trim().toLowerCase();
    const existing = byEmail.get(key);
    if (existing) {
      existing.appointmentCount++;
    } else {
      byEmail.set(key, {
        name: a.customerName,
        email: a.customerEmail,
        lastAppointment: a.startAt,
        appointmentCount: 1,
      });
    }
  }
  const contacts = [...byEmail.values()].sort(
    (a, b) => b.lastAppointment.getTime() - a.lastAppointment.getTime(),
  );

  return (
    <div className="px-6 md:px-18 py-12 flex flex-col gap-10 max-w-4xl">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">Admin</span>
        <h1 className="font-poster uppercase text-4xl">Kontakte</h1>
        <p className="text-sm text-ink-muted">
          Alle Kundinnen, die schon einmal einen Termin angefragt haben — {contacts.length}{" "}
          {contacts.length === 1 ? "Kontakt" : "Kontakte"}. Wähle einzelne Kontakte oder alle aus, um ihnen
          eine Nachricht zu schicken (z. B. eine Rabattaktion).
        </p>
      </div>

      <KontakteManager contacts={contacts.map((c) => ({ ...c, lastAppointment: c.lastAppointment.toISOString() }))} />
    </div>
  );
}
