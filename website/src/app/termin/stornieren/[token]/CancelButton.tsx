"use client";

import { useState, useTransition } from "react";
import { cancelAppointmentByToken } from "@/app/termin/stornieren/[token]/actions";

const ERROR_MESSAGES: Record<string, string> = {
  not_found: "Dieser Stornierungslink ist leider ungültig.",
  already_cancelled: "Dieser Termin wurde bereits storniert.",
  not_confirmed: "Dieser Termin ist noch nicht bestätigt und kann hier noch nicht storniert werden.",
  past: "Dieser Termin liegt in der Vergangenheit.",
};

export function CancelButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    { type: "success"; depositRefunded: boolean } | { type: "error"; message: string } | null
  >(null);

  function handleCancel() {
    if (!confirm("Termin wirklich stornieren? Das kann nicht rückgängig gemacht werden.")) return;
    startTransition(async () => {
      const outcome = await cancelAppointmentByToken(token);
      if (outcome.ok) {
        setResult({ type: "success", depositRefunded: outcome.depositRefunded });
      } else {
        setResult({ type: "error", message: ERROR_MESSAGES[outcome.reason] });
      }
    });
  }

  if (result?.type === "success") {
    return (
      <div className="rounded-2xl bg-sky-mist p-6 text-center flex flex-col gap-2">
        <p className="font-poster uppercase text-xl text-ocean">Storniert</p>
        <p className="text-sm text-ink-soft">
          Dein Termin wurde storniert.
          {result.depositRefunded && " Deine Anzahlung wird automatisch zurückerstattet."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleCancel}
        disabled={pending}
        className="font-poster uppercase text-lg text-white bg-ocean rounded-full px-8 py-4 disabled:opacity-40 transition"
      >
        {pending ? "Wird storniert…" : "Termin stornieren"}
      </button>
      {result?.type === "error" && <p className="text-sm text-coral font-semibold text-center">{result.message}</p>}
    </div>
  );
}
