"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createManualAppointment } from "@/app/admin/actions";
import { ServiceSelect } from "@/components/ServiceSelect";

type Service = {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  priceCents: number;
};

const fieldClass = "border border-sky-mist rounded-xl px-4 py-3";

export function ManualAppointmentForm({ services }: { services: Service[] }) {
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function reset() {
    setDate("");
    setTime("10:00");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setNote("");
    setError(null);
  }

  function submit(force: boolean) {
    startTransition(async () => {
      const result = await createManualAppointment({
        serviceId,
        date,
        time,
        customerName,
        customerEmail,
        customerPhone,
        note,
        force,
      });
      if (result.ok) {
        reset();
        setOpen(false);
        router.refresh();
        return;
      }
      if ("conflict" in result) {
        if (confirm("Zu dieser Zeit ist bereits ein anderer Termin eingetragen. Trotzdem anlegen?")) {
          submit(true);
        }
        return;
      }
      setError(result.error);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !date || !time || !customerName.trim() || !customerEmail.trim()) return;
    submit(false);
  }

  return (
    <section className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="font-semibold text-lg text-left flex items-center gap-2 hover:text-ocean transition-colors w-fit"
      >
        <span className="text-ocean">{open ? "−" : "+"}</span> Termin manuell eintragen
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg rounded-2xl bg-sky-mist/60 p-6">
          <p className="text-sm text-ink-muted -mt-1">
            Für Termine, die du selbst entgegennimmst (Telefon, vor Ort). Die Kundin bekommt sofort dieselbe
            Bestätigungsmail wie bei einer Online-Buchung, inklusive Stornierungslink — und 2 Tage nach dem
            Termin automatisch die Bewertungs-Anfrage.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Leistung</label>
            <ServiceSelect services={services} value={serviceId} onChange={setServiceId} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="manual-date" className="text-sm font-semibold">
                Datum
              </label>
              <input
                id="manual-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="manual-time" className="text-sm font-semibold">
                Uhrzeit
              </label>
              <input
                id="manual-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="manual-name" className="text-sm font-semibold">
                Name der Kundin
              </label>
              <input
                id="manual-name"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="manual-email" className="text-sm font-semibold">
                E-Mail
              </label>
              <input
                id="manual-email"
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="manual-phone" className="text-sm font-semibold">
              Telefon (optional)
            </label>
            <input
              id="manual-phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="manual-note" className="text-sm font-semibold">
              Notiz (optional)
            </label>
            <input
              id="manual-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={fieldClass}
            />
          </div>

          {error && <p className="text-sm text-coral font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="font-poster uppercase text-white bg-ocean rounded-full px-6 py-3 disabled:opacity-40 w-fit"
          >
            {pending ? "Wird angelegt…" : "Termin anlegen"}
          </button>
        </form>
      )}
    </section>
  );
}
