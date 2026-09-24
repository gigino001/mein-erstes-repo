import { prisma } from "@/lib/prisma";
import { BlockForm } from "@/app/admin/(dashboard)/blockieren/BlockForm";
import { DeleteBlockButton } from "@/app/admin/(dashboard)/blockieren/DeleteBlockButton";

function formatDate(d: Date) {
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function BlockierenPage() {
  const staff = await prisma.staff.findFirst({ where: { active: true } });
  if (!staff) return <div className="px-6 md:px-18 py-12">Keine aktive Mitarbeiterin gefunden.</div>;

  const exceptions = await prisma.availabilityException.findMany({
    where: { staffId: staff.id, date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    orderBy: { date: "asc" },
  });

  return (
    <div className="px-6 md:px-18 py-12 flex flex-col gap-14 max-w-4xl">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">Admin</span>
        <h1 className="font-poster uppercase text-4xl">Zeiten blockieren</h1>
        <p className="text-ink-soft max-w-md">
          Urlaub, Feiertage oder spontane Ausfälle — geblockte Zeiten erscheinen für Kundinnen
          automatisch nicht mehr als buchbar.
        </p>
      </div>

      <BlockForm staffId={staff.id} />

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-lg">Geplante Blockierungen</h2>
        {exceptions.length === 0 && <p className="text-sm text-ink-muted">Keine Blockierungen geplant.</p>}
        <div className="flex flex-col divide-y divide-sky-mist">
          {exceptions.map((ex) => (
            <div key={ex.id} className="py-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold">{formatDate(ex.date)}</p>
                <p className="text-sm text-ink-muted">
                  {ex.allDay
                    ? "Ganzer Tag"
                    : `${String(Math.floor((ex.startMinute ?? 0) / 60)).padStart(2, "0")}:${String((ex.startMinute ?? 0) % 60).padStart(2, "0")} – ${String(Math.floor((ex.endMinute ?? 0) / 60)).padStart(2, "0")}:${String((ex.endMinute ?? 0) % 60).padStart(2, "0")}`}
                  {ex.reason && ` · ${ex.reason}`}
                </p>
              </div>
              <DeleteBlockButton id={ex.id} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
