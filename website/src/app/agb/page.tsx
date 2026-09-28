import type { Metadata } from "next";
import Link from "next/link";
import { business, fullAddress } from "@/lib/business";

// HINWEIS (kein Rechtsrat): Basiert auf einer von Claudia bereitgestellten Vorlage,
// an die tatsächlich umgesetzte Anzahlungsregel (50 % bei Neumodellage, online über
// Stripe) angepasst. Vor Live-Schaltung bitte von Claudia bzw. einer Rechtsberatung
// prüfen und bestätigen lassen.
export const metadata: Metadata = {
  title: "AGB",
  alternates: { canonical: "/agb" },
};

export default function AgbPage() {
  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-8 max-w-2xl mx-auto text-ink-soft leading-relaxed">
      <h1 className="font-poster uppercase text-4xl text-ink">
        Allgemeine Geschäftsbedingungen
      </h1>

      <section>
        <h2 className="font-semibold text-ink mb-2">1. Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Dienstleistungen zwischen{" "}
          {business.legalName} – {business.name} {business.address.city} (im Folgenden
          „Stylistin&quot;) und ihren Kundinnen/Kunden, soweit nichts anderes schriftlich vereinbart
          wurde.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">2. Leistungen</h2>
        <p>
          Die Stylistin bietet kosmetische Dienstleistungen im Bereich Wimpernverlängerung und
          -verdichtung sowie ergänzende Schönheitsbehandlungen an. Die jeweilige Leistung richtet
          sich nach der individuellen Buchung.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">3. Termine, Anzahlung und Stornierungen</h2>
        <p>
          Terminvereinbarungen sind verbindlich. Für Leistungen der Kategorie „Neumodellage&quot; ist
          bei der Online-Buchung eine Anzahlung in Höhe von 50 % des Behandlungspreises fällig,
          die online per Karte über unseren Zahlungsdienstleister Stripe zu zahlen ist und mit dem
          Endbetrag der Behandlung verrechnet wird. Für alle anderen Leistungen (u. a.
          Auffülltermine) ist keine Anzahlung erforderlich.
        </p>
        <p className="mt-3">
          Terminabsagen müssen mindestens 24 Stunden vor dem vereinbarten Termin erfolgen (z. B.
          telefonisch, per E-Mail oder Instagram-Nachricht). Bei kurzfristigeren Stornierungen
          unter 24 Stunden wird eine Ausfallgebühr in Höhe von 50 % des gebuchten
          Behandlungspreises fällig.
        </p>
        <p className="mt-3">
          Eine bereits geleistete Anzahlung wird bei einer Stornierung unter 24 Stunden nicht
          erstattet.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">4. Verspätungen</h2>
        <p>
          Bei einer Verspätung von mehr als 15 Minuten entfällt der Anspruch auf die Behandlung
          und es werden 80 % der gebuchten Leistung als Ausfallgebühr in Rechnung gestellt.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">5. Preise und Zahlung</h2>
        <p>
          Die aktuellen Preise sind im Studio oder online auf der{" "}
          <Link href="/leistungen" className="text-ocean">
            Leistungen-Seite
          </Link>{" "}
          einsehbar. Alle Preise sind Endpreise gemäß § 19 UStG (Kleinunternehmerregelung). Der
          Restbetrag nach Abzug einer eventuellen Anzahlung wird nach der Behandlung in bar oder
          nach Absprache per Überweisung beglichen.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">6. Haftung</h2>
        <p>
          Die Stylistin übernimmt keine Haftung für allergische Reaktionen oder
          Unverträglichkeiten auf verwendete Produkte. Kundinnen/Kunden sind verpflichtet, vor der
          Behandlung auf Allergien oder gesundheitliche Einschränkungen hinzuweisen.
        </p>
        <p className="mt-3">
          Für Beeinträchtigungen, die durch die Missachtung der Pflegehinweise entstehen,
          übernimmt die Stylistin keine Haftung.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">7. Gewährleistung</h2>
        <p>
          Reklamationen müssen innerhalb von 3 Tagen nach der Behandlung gemeldet werden, um eine
          eventuelle Nachbesserung zu ermöglichen.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">8. Gutscheine</h2>
        <p>Erworbene Gutscheine sind ab Ausstellungsdatum 3 Jahre gültig und nicht auszahlbar.</p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">9. Datenschutz</h2>
        <p>
          Personenbezogene Daten werden ausschließlich zur Abwicklung der Dienstleistung sowie zur
          Kundenbetreuung verarbeitet. Details zu Umfang, Zweck und den dabei eingesetzten
          Dienstleistern (u. a. Hosting, Zahlungsabwicklung, E-Mail-Versand) findest du in unserer{" "}
          <Link href="/datenschutz" className="text-ocean">
            Datenschutzerklärung
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">10. Schlussbestimmungen</h2>
        <p>
          Sollte eine Bestimmung dieser AGB unwirksam sein, bleiben die übrigen Bestimmungen
          unberührt. Änderungen oder Ergänzungen dieser AGB bedürfen der Schriftform.
        </p>
      </section>

      <p className="text-sm text-ink-muted">
        Bei Fragen erreichst du {business.owner} jederzeit unter{" "}
        <a href={`mailto:${business.email}`} className="text-ocean">
          {business.email}
        </a>
        , telefonisch unter {business.phoneDisplay} oder direkt im Studio, {fullAddress}.
      </p>
    </div>
  );
}
