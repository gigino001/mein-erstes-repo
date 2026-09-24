import type { Metadata } from "next";
import { business, fullAddress } from "@/lib/business";

// HINWEIS (kein Rechtsrat): Entwurf nach den Mindestangaben für Einzelunternehmerinnen
// gemäß § 5 TMG. Vor Live-Schaltung bitte von Claudia bzw. einer Rechtsberatung prüfen
// und die als "[...]" markierten Platzhalter ergänzen (z. B. USt-IdNr., falls vorhanden).
export const metadata: Metadata = {
  title: "Impressum",
};

export default function ImpressumPage() {
  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-8 max-w-2xl mx-auto text-ink-soft leading-relaxed">
      <h1 className="font-poster uppercase text-4xl text-ink">Impressum</h1>

      <section>
        <h2 className="font-semibold text-ink mb-2">Angaben gemäß § 5 TMG</h2>
        <p>
          {business.legalName}
          <br />
          {business.name}
          <br />
          {fullAddress}
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">Kontakt</h2>
        <p>
          Telefon: {business.phoneDisplay}
          <br />
          E-Mail: {business.email}
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">Umsatzsteuer-Identifikationsnummer</h2>
        <p>[USt-IdNr. ergänzen, falls vorhanden — sonst Abschnitt entfernen]</p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          {business.legalName}
          <br />
          {fullAddress}
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">EU-Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ocean"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          . Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor
          einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>
    </div>
  );
}
