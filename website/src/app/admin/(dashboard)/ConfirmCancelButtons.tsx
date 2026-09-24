"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmAppointment, cancelAppointment } from "@/app/admin/actions";

export function ConfirmCancelButtons({ id, showConfirm }: { id: string; showConfirm: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handle(action: (id: string) => Promise<void>) {
    startTransition(async () => {
      await action(id);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2 shrink-0">
      {showConfirm && (
        <button
          disabled={pending}
          onClick={() => handle(confirmAppointment)}
          className="text-sm font-semibold text-white bg-ocean rounded-full px-5 py-2 disabled:opacity-40"
        >
          Bestätigen
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Diesen Termin wirklich absagen?")) handle(cancelAppointment);
        }}
        className="text-sm font-semibold text-ink border border-sky-mist rounded-full px-5 py-2 disabled:opacity-40 hover:border-coral"
      >
        Absagen
      </button>
    </div>
  );
}
