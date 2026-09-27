"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDuration, formatPrice, CATEGORY_LABELS } from "@/lib/format";
import { requestAppointment } from "@/app/termin/actions";

const fieldClass =
  "border-2 border-ink/20 rounded-xl px-4 py-3 bg-white focus:border-ocean focus:outline-none transition-colors";

type Service = {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  priceCents: number;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function maxDateStr() {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().slice(0, 10);
}

export function BookingForm({ services, staffId }: { services: Service[]; staffId: string }) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "submitting" } | { type: "success" } | { type: "error"; message: string }
  >({ type: "idle" });

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  useEffect(() => {
    if (!serviceId || !date) return;
    // Gewünschtes Verhalten: Auswahl zurücksetzen, sobald Leistung/Datum wechseln.
    setSlot(null);
    setLoadingSlots(true);
    const params = new URLSearchParams({ serviceId, staffId, date });
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [serviceId, date, staffId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot || !selectedService || !privacyAccepted) return;
    setStatus({ type: "submitting" });
    const result = await requestAppointment({
      serviceId,
      staffId,
      date,
      slot,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      note,
    });
    if (result.ok) {
      setStatus({ type: "success" });
    } else {
      setStatus({ type: "error", message: result.error });
    }
  }

  if (status.type === "success") {
    return (
      <div className="rounded-2xl bg-sky-mist p-10 text-center flex flex-col gap-3">
        <p className="font-poster uppercase text-3xl text-ocean">Danke!</p>
        <p className="text-ink-soft">
          Deine Terminanfrage ist bei mir eingegangen. Ich melde mich zeitnah bei dir, um sie zu
          bestätigen.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" htmlFor="service">
          Leistung
        </label>
        <div className="relative">
          <select
            id="service"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className={`${fieldClass} w-full appearance-none pr-11`}
          >
            {["neumodellage", "auffuellen", "sonstiges"].map((category) => {
              const items = services.filter((s) => s.category === category);
              if (items.length === 0) return null;
              return (
                <optgroup key={category} label={CATEGORY_LABELS[category]}>
                  {items.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatDuration(s.durationMinutes)} — {formatPrice(s.priceCents)}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ocean"
          >
            <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" htmlFor="date">
          Datum
        </label>
        <input
          id="date"
          type="date"
          value={date}
          min={todayStr()}
          max={maxDateStr()}
          onChange={(e) => setDate(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Uhrzeit</span>
        {loadingSlots && <p className="text-sm text-ink-muted">Verfügbare Zeiten werden geladen…</p>}
        {!loadingSlots && slots.length === 0 && (
          <p className="text-sm text-ink-muted">An diesem Tag ist leider kein Termin mehr frei.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setSlot(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
                slot === s
                  ? "bg-ocean text-white border-ocean"
                  : "bg-white text-ink border-ink/20 hover:border-ocean"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold" htmlFor="phone">
            Telefon
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" htmlFor="email">
          E-Mail
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" htmlFor="note">
          Anmerkung (optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className={fieldClass}
        />
      </div>

      <label htmlFor="privacy" className="flex items-start gap-3 text-sm cursor-pointer">
        <input
          id="privacy"
          type="checkbox"
          required
          checked={privacyAccepted}
          onChange={(e) => setPrivacyAccepted(e.target.checked)}
          className="mt-0.5 w-5 h-5 shrink-0 rounded border-2 border-ink/30 accent-ocean cursor-pointer"
        />
        <span className="text-ink-soft">
          Ich habe die{" "}
          <Link href="/datenschutz" target="_blank" className="font-semibold text-ocean underline">
            Datenschutzerklärung
          </Link>{" "}
          gelesen und bin mit der Verarbeitung meiner Daten zur Terminanfrage einverstanden. *
        </span>
      </label>

      {status.type === "error" && <p className="text-sm text-coral font-semibold">{status.message}</p>}

      <button
        type="submit"
        disabled={!slot || !privacyAccepted || status.type === "submitting"}
        className="font-poster uppercase text-lg text-white bg-ocean rounded-full px-8 py-4 disabled:opacity-40 transition"
      >
        {status.type === "submitting" ? "Wird gesendet…" : "Termin anfragen"}
      </button>
      <p className="text-xs text-ink-muted -mt-4">
        Unverbindliche Anfrage — Claudia bestätigt deinen Termin persönlich.
      </p>
    </form>
  );
}
