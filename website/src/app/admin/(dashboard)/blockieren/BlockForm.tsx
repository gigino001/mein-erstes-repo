"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBlock } from "@/app/admin/actions";

export function BlockForm({ staffId }: { staffId: string }) {
  const [date, setDate] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("20:00");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toMinutes(hhmm: string) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    startTransition(async () => {
      await createBlock({
        staffId,
        date,
        allDay,
        startMinute: allDay ? undefined : toMinutes(start),
        endMinute: allDay ? undefined : toMinutes(end),
        reason,
      });
      setDate("");
      setReason("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-sm">
      <div className="flex flex-col gap-2">
        <label htmlFor="block-date" className="text-sm font-semibold">
          Datum
        </label>
        <input
          id="block-date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-sky-mist rounded-xl px-4 py-3"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        Ganzer Tag
      </label>

      {!allDay && (
        <div className="flex gap-3">
          <div className="flex flex-col gap-2 flex-1">
            <label htmlFor="block-start" className="text-sm font-semibold">
              Von
            </label>
            <input
              id="block-start"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="border border-sky-mist rounded-xl px-4 py-3"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label htmlFor="block-end" className="text-sm font-semibold">
              Bis
            </label>
            <input
              id="block-end"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="border border-sky-mist rounded-xl px-4 py-3"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="block-reason" className="text-sm font-semibold">
          Grund (optional)
        </label>
        <input
          id="block-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="z. B. Urlaub"
          className="border border-sky-mist rounded-xl px-4 py-3"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="font-poster uppercase text-white bg-ocean rounded-full px-6 py-3 disabled:opacity-40 w-fit"
      >
        {pending ? "Speichert…" : "Blockieren"}
      </button>
    </form>
  );
}
