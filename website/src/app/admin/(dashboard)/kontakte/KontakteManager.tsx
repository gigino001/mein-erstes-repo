"use client";

import { useMemo, useState, useTransition } from "react";
import { sendMarketingMail } from "@/app/admin/actions";

type Contact = {
  name: string;
  email: string;
  lastAppointment: string;
  appointmentCount: number;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function KontakteManager({ contacts }: { contacts: Contact[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const allSelected = contacts.length > 0 && selected.size === contacts.length;

  function toggleOne(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
    setResult(null);
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(contacts.map((c) => c.email)));
    setResult(null);
  }

  const canSend = useMemo(
    () => selected.size > 0 && subject.trim() !== "" && message.trim() !== "" && !pending,
    [selected, subject, message, pending],
  );

  function handleSend() {
    if (!canSend) return;
    const count = selected.size;
    const confirmed = window.confirm(
      `Nachricht wirklich an ${count} ${count === 1 ? "Kontakt" : "Kontakte"} senden?`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const outcome = await sendMarketingMail({
        emails: [...selected],
        subject: subject.trim(),
        message: message.trim(),
      });
      setResult(outcome);
      if (outcome.failed === 0) {
        setSubject("");
        setMessage("");
        setSelected(new Set());
      }
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">
            Kontaktliste {contacts.length > 0 && `(${selected.size} von ${contacts.length} ausgewählt)`}
          </h2>
          {contacts.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm font-semibold text-ocean hover:underline"
            >
              {allSelected ? "Alle abwählen" : "Alle auswählen"}
            </button>
          )}
        </div>

        {contacts.length === 0 ? (
          <p className="text-sm text-ink-muted">Noch keine Kontakte vorhanden.</p>
        ) : (
          <div className="border border-sky-mist rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sky-mist/60 text-left">
                <tr>
                  <th className="w-10 px-4 py-3" />
                  <th className="px-2 py-3 font-semibold">Name</th>
                  <th className="px-2 py-3 font-semibold">E-Mail</th>
                  <th className="px-2 py-3 font-semibold">Letzter Termin</th>
                  <th className="px-2 py-3 font-semibold text-right">Termine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-mist">
                {contacts.map((c) => (
                  <tr
                    key={c.email}
                    className="hover:bg-sky-mist/30 cursor-pointer"
                    onClick={() => toggleOne(c.email)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(c.email)}
                        onChange={() => toggleOne(c.email)}
                        className="w-4 h-4 accent-ocean cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-3 font-semibold">{c.name}</td>
                    <td className="px-2 py-3 text-ink-soft">{c.email}</td>
                    <td className="px-2 py-3 text-ink-muted">{formatDate(c.lastAppointment)}</td>
                    <td className="px-2 py-3 text-right text-ink-muted">{c.appointmentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-5 max-w-xl">
        <h2 className="font-semibold text-lg">Nachricht senden</h2>

        <div className="flex flex-col gap-2">
          <label htmlFor="mail-subject" className="text-sm font-semibold">
            Betreff
          </label>
          <input
            id="mail-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="z. B. Exklusive Rabattaktion für dich 🎉"
            className="border border-sky-mist rounded-xl px-4 py-3"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="mail-message" className="text-sm font-semibold">
            Nachricht
          </label>
          <textarea
            id="mail-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            placeholder="Deine Nachricht — die Mail beginnt automatisch mit „Hallo [Vorname],“ und endet mit deiner Signatur."
            className="border border-sky-mist rounded-xl px-4 py-3"
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="font-poster uppercase text-white bg-ocean rounded-full px-6 py-3 disabled:opacity-40 w-fit"
        >
          {pending
            ? "Wird gesendet…"
            : `An ${selected.size} ${selected.size === 1 ? "Kontakt" : "Kontakte"} senden`}
        </button>

        {result && (
          <p className={`text-sm font-semibold ${result.failed > 0 ? "text-coral" : "text-ocean"}`}>
            {result.sent} von {result.total} Mails erfolgreich versendet.
            {result.failed > 0 && ` ${result.failed} fehlgeschlagen — bitte später erneut versuchen.`}
          </p>
        )}
      </section>
    </div>
  );
}
