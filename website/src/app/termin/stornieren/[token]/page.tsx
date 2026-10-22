import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatPrice } from "@/lib/format";
import { CancelButton } from "@/app/termin/stornieren/[token]/CancelButton";

export const metadata: Metadata = {
  title: "Termin stornieren",
  robots: { index: false, follow: false },
};

function formatDateTime(d: Date) {
  return d.toLocaleString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md flex flex-col gap-3 text-center">
        <h1 className="font-poster uppercase text-3xl">{title}</h1>
        <p className="text-ink-soft">{message}</p>
      </div>
    </div>
  );
}

export default async function StornierenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { cancelToken: token },
    include: { service: true },
  });

  if (!appointment) {
    return (
      <StatusMessage
        title="Link ungültig"
        message="Dieser Stornierungslink ist leider ungültig. Bitte kontaktiere uns direkt, falls du deinen Termin stornieren möchtest."
      />
    );
  }
  if (appointment.status === "cancelled") {
    return <StatusMessage title="Bereits storniert" message="Dieser Termin wurde bereits storniert." />;
  }
  if (appointment.status !== "confirmed") {
    return (
      <StatusMessage
        title="Noch nicht bestätigt"
        message="Dieser Termin ist noch nicht bestätigt und kann hier noch nicht storniert werden. Bitte kontaktiere uns direkt."
      />
    );
  }
  if (appointment.startAt.getTime() < Date.now()) {
    return <StatusMessage title="Termin bereits vorbei" message="Dieser Termin liegt in der Vergangenheit." />;
  }

  const hoursUntilStart = (appointment.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
  const hasDeposit = appointment.depositAmountCents > 0;
  const willLoseDeposit = hasDeposit && hoursUntilStart < 24;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
            Termin stornieren
          </span>
          <h1 className="font-poster uppercase text-3xl">Bist du sicher?</h1>
        </div>

        <div className="rounded-2xl bg-sky-mist p-6 flex flex-col gap-1">
          <p className="font-semibold">{appointment.service.name}</p>
          <p className="text-ink-soft">{formatDateTime(appointment.startAt)}</p>
          <p className="text-ink-soft">
            {formatDuration(appointment.service.durationMinutes)} · {formatPrice(appointment.service.priceCents)}
          </p>
        </div>

        {hasDeposit && (
          <p className="text-sm text-ink-muted">
            {willLoseDeposit
              ? `Da der Termin weniger als 24 Stunden entfernt ist, verfällt deine bezahlte Anzahlung von ${formatPrice(appointment.depositAmountCents)} gemäß unseren AGB.`
              : `Deine Anzahlung von ${formatPrice(appointment.depositAmountCents)} wird automatisch zurückerstattet.`}
          </p>
        )}

        <CancelButton token={token} />
      </div>
    </div>
  );
}
