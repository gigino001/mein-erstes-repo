import type { Metadata } from "next";
import { business, fullAddress } from "@/lib/business";

// HINWEIS (kein Rechtsrat): Entwurf-Grundgerüst einer Datenschutzerklärung nach DSGVO
// für eine kleine, lokale Website mit Kontaktformular/Terminbuchung. Vor Live-Schaltung
// bitte von Claudia bzw. einer Rechtsberatung prüfen und ergänzen (insb. sobald echte
// Analyse-/Marketing-Tools, Zahlungsanbieter o. Ä. hinzukommen).
export const metadata: Metadata = {
  title: "Datenschutzerklärung",
};

export default function DatenschutzPage() {
  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-8 max-w-2xl mx-auto text-ink-soft leading-relaxed">
      <h1 className="font-poster uppercase text-4xl text-ink">Datenschutzerklärung</h1>

      <section>
        <h2 className="font-semibold text-ink mb-2">1. Verantwortlicher</h2>
        <p>
          {business.legalName}
          <br />
          {fullAddress}
          <br />
          E-Mail: {business.email}
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">2. Terminbuchung</h2>
        <p>
          Wenn du über unser Buchungsformular einen Termin anfragst, verarbeiten wir die von dir
          angegebenen Daten (Name, E-Mail-Adresse, Telefonnummer, gewünschte Leistung, Termin,
          ggf. Anmerkungen) ausschließlich zur Bearbeitung und Bestätigung deines Termins
          (Art. 6 Abs. 1 lit. b DSGVO). Die Daten werden gelöscht, sobald sie für diesen Zweck
          nicht mehr erforderlich sind, soweit keine gesetzlichen Aufbewahrungspflichten
          entgegenstehen.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">3. Hosting</h2>
        <p>
          Diese Website wird bei [Hosting-Anbieter ergänzen, z. B. ALL-INKL.COM] gehostet. Beim
          Besuch der Website verarbeitet unser Hoster automatisch technische Zugriffsdaten
          (z. B. IP-Adresse, Datum und Uhrzeit des Zugriffs) in sogenannten Server-Logfiles, um
          den sicheren und stabilen Betrieb der Website zu gewährleisten (Art. 6 Abs. 1 lit. f
          DSGVO).
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">4. Deine Rechte</h2>
        <p>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung deiner personenbezogenen
          Daten. Wende dich dazu an die oben genannte Kontaktadresse. Außerdem hast du das Recht,
          dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">5. Kontaktaufnahme</h2>
        <p>
          Wenn du uns per E-Mail, Telefon oder WhatsApp kontaktierst, verarbeiten wir die dabei
          übermittelten Daten zur Bearbeitung deiner Anfrage (Art. 6 Abs. 1 lit. b bzw. f DSGVO).
        </p>
      </section>
    </div>
  );
}
