import type { Metadata } from "next";
import { business } from "@/lib/business";

// HINWEIS: Platzhalter-Seite. Der eigentliche AGB-Text wird von Claudia nachgereicht
// (z. B. Regelungen zu Terminabsage/-verschiebung, No-Show, Zahlungsbedingungen,
// Gewährleistung bei Wimpernleistungen). Bis dahin bewusst ohne generischen
// KI-generierten Rechtstext, um keine falschen/unpassenden Klauseln zu veröffentlichen.
export const metadata: Metadata = {
  title: "AGB",
};

export default function AgbPage() {
  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-8 max-w-2xl mx-auto text-ink-soft leading-relaxed">
      <h1 className="font-poster uppercase text-4xl text-ink">
        Allgemeine Geschäftsbedingungen
      </h1>
      <p>
        Unsere Allgemeinen Geschäftsbedingungen folgen in Kürze an dieser Stelle. Bei Fragen zu
        deinem Termin erreichst du {business.owner} jederzeit direkt unter{" "}
        <a href={`mailto:${business.email}`} className="text-ocean">
          {business.email}
        </a>{" "}
        oder telefonisch unter {business.phoneDisplay}.
      </p>
    </div>
  );
}
