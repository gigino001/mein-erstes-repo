import { prisma } from "@/lib/prisma";
import { formatDuration, formatPrice } from "@/lib/format";
import { ConfirmCancelButtons } from "@/app/admin/(dashboard)/ConfirmCancelButtons";
import { ManualAppointmentForm } from "@/app/admin/(dashboard)/ManualAppointmentForm";
import { AppointmentCalendar } from "@/app/admin/(dashboard)/AppointmentCalendar";

function formatDateTime(d: Date) {
  return d.toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminDashboardPage() {
  const [appointments, services] = await Promise.all([
    prisma.appointment.findMany({
      where: { status: { not: "cancelled" } },
      orderBy: { startAt: "asc" },
      include: { service: true },
    }),
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const now = new Date();
  const requested = appointments.filter((a) => a.status === "requested" && a.startAt >= now);
  const stalePastRequests = appointments.filter((a) => a.status === "requested" && a.startAt < now);
  const confirmed = appointments.filter((a) => a.status === "confirmed");

  return (
    <div className="px-6 md:px-18 py-12 flex flex-col gap-14 max-w-4xl">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Admin
        </span>
        <h1 className="font-poster uppercase text-4xl">Termine</h1>
      </div>

      <ManualAppointmentForm services={services} />

      <section className="flex flex-col gap-5">
        <h2 className="font-semibold text-lg">
          Offene Anfragen {requested.length > 0 && <span className="text-coral">({requested.length})</span>}
        </h2>
        {requested.length === 0 && <p className="text-sm text-ink-muted">Keine offenen Anfragen.</p>}
        <div className="flex flex-col gap-3">
          {requested.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl bg-coral-soft p-5 flex items-center justify-between gap-4 flex-wrap"
            >
              <div>
                <p className="font-semibold">
                  {a.customerName} — {a.service.name}
                </p>
                <p className="text-sm text-ink-soft">
                  {formatDateTime(a.startAt)} · {formatDuration(a.service.durationMinutes)} ·{" "}
                  {formatPrice(a.service.priceCents)}
                  {a.depositAmountCents > 0 && (
                    <span className="text-ocean font-semibold">
                      {" "}
                      · {formatPrice(a.depositAmountCents)} Anzahlung bezahlt
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  {a.customerPhone} · {a.customerEmail}
                  {a.customerInstagram && ` · ${a.customerInstagram}`}
                  {a.note && ` · „${a.note}“`}
                </p>
              </div>
              <ConfirmCancelButtons id={a.id} showConfirm hasDeposit={a.depositAmountCents > 0} />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-semibold text-lg">Bestätigte Termine</h2>
        <AppointmentCalendar
          appointments={confirmed.map((a) => ({
            id: a.id,
            customerName: a.customerName,
            serviceName: a.service.name,
            durationMinutes: a.service.durationMinutes,
            priceCents: a.service.priceCents,
            depositAmountCents: a.depositAmountCents,
            startAt: a.startAt.toISOString(),
          }))}
        />
      </section>

      {stalePastRequests.length > 0 && (
        <section className="flex flex-col gap-5">
          <h2 className="font-semibold text-lg text-ink-muted">Abgelaufene offene Anfragen ({stalePastRequests.length})</h2>
          <div className="flex flex-col divide-y divide-sky-mist opacity-60">
            {stalePastRequests.slice(-10).reverse().map((a) => (
              <div key={a.id} className="py-3 text-sm">
                {formatDateTime(a.startAt)} — {a.customerName} — {a.service.name}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
