"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmAppointment, cancelAppointment } from "@/app/admin/actions";

export function ConfirmCancelButtons({
  id,
  showConfirm,
  hasDeposit,
}: {
  id: string;
  showConfirm: boolean;
  hasDeposit: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      await confirmAppointment(id);
      router.refresh();
    });
  }

  function handleCancel(initiatedByCustomer: boolean) {
    const message = initiatedByCustomer
      ? "Termin als Stornierung durch die Kundin absagen? Die Anzahlung wird nur automatisch zurückerstattet, wenn der Termin noch mindestens 24 Stunden entfernt ist (siehe AGB) — sonst verfällt sie."
      : "Diesen Termin wirklich absagen? Eine bereits bezahlte Anzahlung wird automatisch zurückerstattet.";
    if (!confirm(message)) return;
    startTransition(async () => {
      await cancelAppointment(id, initiatedByCustomer);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2 shrink-0 flex-wrap">
      {showConfirm && (
        <button
          disabled={pending}
          onClick={handleConfirm}
          className="text-sm font-semibold text-white bg-ocean rounded-full px-5 py-2 disabled:opacity-40"
        >
          Bestätigen
        </button>
      )}
      {hasDeposit ? (
        <>
          <button
            disabled={pending}
            onClick={() => handleCancel(false)}
            className="text-sm font-semibold text-ink border border-sky-mist rounded-full px-5 py-2 disabled:opacity-40 hover:border-coral"
          >
            Absagen (Studio)
          </button>
          <button
            disabled={pending}
            onClick={() => handleCancel(true)}
            className="text-sm font-semibold text-ink border border-sky-mist rounded-full px-5 py-2 disabled:opacity-40 hover:border-coral"
          >
            Absagen (Kundin storniert)
          </button>
        </>
      ) : (
        <button
          disabled={pending}
          onClick={() => handleCancel(false)}
          className="text-sm font-semibold text-ink border border-sky-mist rounded-full px-5 py-2 disabled:opacity-40 hover:border-coral"
        >
          Absagen
        </button>
      )}
    </div>
  );
}
