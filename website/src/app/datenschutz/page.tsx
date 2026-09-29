import type { Metadata } from "next";
import { business, fullAddress } from "@/lib/business";

// HINWEIS (kein Rechtsrat): Entwurf einer Datenschutzerklärung nach DSGVO für diese
// konkrete Website (Terminbuchung, Google-Maps-Einbindung, Admin-Bereich mit Login).
// Vor Live-Schaltung bitte von Claudia bzw. einer Rechtsberatung prüfen und bestätigen
// lassen — insbesondere sobald sich Hosting, E-Mail-Versand oder eingebundene Dienste
// ändern oder neue Tools (Analyse, Werbung, Zahlungsanbieter) hinzukommen.
export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  alternates: { canonical: "/datenschutz" },
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
          angegebenen Daten (Vor- und Nachname, E-Mail-Adresse, Telefonnummer, optional dein
          Instagram-Profil, gewünschte Leistung, Termin, ggf. Anmerkungen) ausschließlich zur
          Bearbeitung und Bestätigung deines Termins (Art. 6 Abs. 1 lit. b DSGVO). Die
          Bestätigung erfolgt per E-Mail; dazu geben wir deine Daten an unseren
          E-Mail-Versanddienstleister weiter (siehe Ziffer 7). Für bestimmte Leistungen ist bei
          Buchung eine Anzahlung fällig, die über unseren Zahlungsdienstleister Stripe abgewickelt
          wird (siehe Ziffer 6). Die Daten werden gelöscht, sobald
          sie für diesen Zweck nicht mehr erforderlich sind, soweit keine gesetzlichen
          Aufbewahrungspflichten entgegenstehen.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">3. Hosting</h2>
        <p>
          Diese Website wird bei Netlify, Inc. (San Francisco, USA) gehostet. Die
          Terminbuchungsdaten werden in einer bei Netlify betriebenen Postgres-Datenbank
          (Netlify DB) gespeichert. Beim Besuch der Website verarbeitet unser Hoster automatisch
          technische Zugriffsdaten (z. B. IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene
          Seite) in sogenannten Server-Logfiles, um den sicheren und stabilen Betrieb der Website
          zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO). Bei einer Datenübermittlung in die USA
          stützt sich Netlify nach eigenen Angaben auf geeignete Garantien (u. a.
          Standardvertragsklauseln); weitere Informationen:{" "}
          <a
            href="https://www.netlify.com/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ocean"
          >
            netlify.com/privacy
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">4. Google Maps</h2>
        <p>
          Auf unserer Kontaktseite binden wir eine Karte des Dienstes Google Maps ein, betrieben
          von Google Ireland Limited (bzw. Google LLC, USA). Beim Aufruf der Kontaktseite wird
          eine Verbindung zu Servern von Google hergestellt, wobei deine IP-Adresse und ggf.
          weitere Daten an Google übermittelt werden können — unabhängig davon, ob du mit der
          Karte interagierst. Dies geschieht auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
          (berechtigtes Interesse an einer übersichtlichen und einfach auffindbaren
          Standortdarstellung). Weitere Informationen zur Datenverarbeitung durch Google:{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ocean"
          >
            policies.google.com/privacy
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">5. Cookies im Admin-Bereich</h2>
        <p>
          Für den passwortgeschützten Admin-Bereich (Terminverwaltung durch {business.owner})
          setzen wir ein technisch notwendiges Session-Cookie, um den Login-Zustand zu speichern.
          Dieses Cookie ist für den normalen Website-Besuch nicht erforderlich, dient keiner
          Analyse oder Werbung und wird nur bei Anmeldung im Admin-Bereich gesetzt
          (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">6. Zahlungsabwicklung (Stripe)</h2>
        <p>
          Für bestimmte Leistungen ist bei der Buchung eine Anzahlung fällig. Diese wickeln wir
          über den Zahlungsdienstleister Stripe Payments Europe, Ltd. ab. Dabei werden deine
          Zahlungsdaten (z. B. Kartendaten) sowie Name und E-Mail-Adresse direkt an Stripe
          übermittelt und dort verarbeitet — wir selbst erhalten und speichern keine
          Kartendaten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des
          Buchungsvertrags). Weitere Informationen:{" "}
          <a
            href="https://stripe.com/de/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ocean"
          >
            stripe.com/de/privacy
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">7. E-Mail-Versand</h2>
        <p>
          Terminanfragen und -bestätigungen versenden wir per E-Mail über einen SMTP-Anbieter.
          Dabei werden Name, E-Mail-Adresse und die zur Terminabwicklung nötigen Angaben an
          diesen Dienstleister übermittelt, der als Auftragsverarbeiter ausschließlich in unserem
          Auftrag tätig wird (Art. 6 Abs. 1 lit. b DSGVO i. V. m. Art. 28 DSGVO).
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">8. Deine Rechte</h2>
        <p>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung deiner personenbezogenen
          Daten. Wende dich dazu an die oben genannte Kontaktadresse. Außerdem hast du das Recht,
          dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">9. Kontaktaufnahme</h2>
        <p>
          Wenn du uns per E-Mail, Telefon, Instagram oder WhatsApp kontaktierst, verarbeiten wir
          die dabei übermittelten Daten zur Bearbeitung deiner Anfrage (Art. 6 Abs. 1 lit. b bzw.
          f DSGVO).
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">10. Bewertungsanfragen</h2>
        <p>
          Etwa zwei Tage nach einem bestätigten Termin senden wir dir per E-Mail einen persönlichen
          Link, über den du freiwillig eine Bewertung zu deinem Termin abgeben kannst
          (Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse an Kundinnen-Feedback). Gibst du
          über diesen Link eine Bewertung ab, werden dein Name, deine Sternebewertung und dein Text
          per E-Mail an uns übermittelt (siehe Ziffer 7). Eine Veröffentlichung auf der Website
          erfolgt ausschließlich nach Rücksprache mit dir.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">11. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir passen diese Datenschutzerklärung an, sobald sich die von uns eingesetzten Dienste
          oder rechtliche Vorgaben ändern. Es gilt jeweils die aktuell auf dieser Seite
          veröffentlichte Fassung.
        </p>
      </section>
    </div>
  );
}
