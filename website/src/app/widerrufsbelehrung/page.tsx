import type { Metadata } from "next";
import { business, fullAddress } from "@/lib/business";

// HINWEIS (kein Rechtsrat): Standard-Widerrufsbelehrung für den Verkauf von Waren im
// Fernabsatz (Online-Shop), angelehnt an das gesetzliche Muster nach Art. 246a § 1
// Abs. 2 und 3 EGBGB. Gilt unabhängig davon, ob eine Bestellung abgeholt oder
// versendet wird — der Vertrag wird online geschlossen, das reicht für die
// Fernabsatz-Einstufung. Vor Live-Schaltung des Shops bitte von Claudia bzw. einer
// Rechtsberatung prüfen und bestätigen lassen, insbesondere die Ausnahme für
// versiegelte Hygieneartikel (z. B. Wimpernkleber).
export const metadata: Metadata = {
  title: "Widerrufsbelehrung",
  alternates: { canonical: "/widerrufsbelehrung" },
};

export default function WiderrufsbelehrungPage() {
  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-8 max-w-2xl mx-auto text-ink-soft leading-relaxed">
      <h1 className="font-poster uppercase text-4xl text-ink">Widerrufsbelehrung</h1>
      <p className="text-sm text-ink-muted">Gilt für Bestellungen im Online-Shop von {business.name}.</p>

      <section>
        <h2 className="font-semibold text-ink mb-2">Widerrufsrecht</h2>
        <p>
          Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
          widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem du oder ein von
          dir benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen hast
          bzw. hat — bzw. bei Abholung im Studio ab dem Tag der Abholung.
        </p>
        <p className="mt-3">
          Um dein Widerrufsrecht auszuüben, musst du uns ({business.legalName}, {fullAddress},
          E-Mail: {business.email}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post
          versandter Brief oder eine E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen,
          informieren. Du kannst dafür das unten stehende Muster-Widerrufsformular verwenden, das
          aber nicht vorgeschrieben ist.
        </p>
        <p className="mt-3">
          Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung
          des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">Folgen des Widerrufs</h2>
        <p>
          Wenn du diesen Vertrag widerrufst, erstatten wir dir alle Zahlungen, die wir von dir
          erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten,
          die sich daraus ergeben, dass du eine andere Art der Lieferung als die von uns
          angebotene, günstigste Standardlieferung gewählt hast), unverzüglich und spätestens
          binnen vierzehn Tagen ab dem Tag, an dem die Mitteilung über deinen Widerruf dieses
          Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe
          Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast, es sei denn,
          mit dir wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden dir wegen
          dieser Rückzahlung Entgelte berechnet.
        </p>
        <p className="mt-3">
          Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder
          bis du den Nachweis erbracht hast, dass du die Waren zurückgesandt hast, je nachdem,
          welches der frühere Zeitpunkt ist.
        </p>
        <p className="mt-3">
          Du hast die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem
          Tag, an dem du uns über den Widerruf dieses Vertrags unterrichtest, an uns
          zurückzusenden oder zu übergeben (bzw. bei Abholung im Studio zurückzubringen). Die Frist
          ist gewahrt, wenn du die Waren vor Ablauf der Frist von vierzehn Tagen absendest. Du
          trägst die unmittelbaren Kosten der Rücksendung der Waren.
        </p>
        <p className="mt-3">
          Du musst für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust
          auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren
          nicht notwendigen Umgang mit ihnen zurückzuführen ist.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">Ausschluss des Widerrufsrechts</h2>
        <p>
          Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung versiegelter Waren, die aus
          Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind, wenn
          ihre Versiegelung nach der Lieferung entfernt wurde (§ 312g Abs. 2 Nr. 3 BGB) — das kann
          z. B. auf geöffnete Kosmetik- oder Hygieneartikel wie Wimpernkleber zutreffen.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-ink mb-2">Muster-Widerrufsformular</h2>
        <p>
          (Wenn du den Vertrag widerrufen willst, kannst du dieses Formular ausfüllen und uns
          zusenden.)
        </p>
        <p className="mt-3">
          An {business.legalName}, {fullAddress}, E-Mail: {business.email}
        </p>
        <p className="mt-3">
          Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über den Kauf der
          folgenden Waren: __________
          <br />
          Bestellt am: __________ / erhalten am: __________
          <br />
          Name des/der Verbraucher(s): __________
          <br />
          Anschrift des/der Verbraucher(s): __________
          <br />
          Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): __________
          <br />
          Datum: __________
        </p>
      </section>
    </div>
  );
}
