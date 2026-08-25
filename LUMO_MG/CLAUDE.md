# LUMO Mönchengladbach — Homepage

## Projekt
Neue Homepage für das LUMO in Mönchengladbach — "Modern Boho brunch &
dinner spot": Brunch, Speciality Coffee, Matcha, Dinner, Signature
Cocktails, Events. Projekt startet bei null (noch kein Code).

Alle Entwuerfe und Dokumente liegen auch im Projekt (Doppelklick genuegt):

| Im Projekt | Veroeffentlicht |
|---|---|
| `dokumente/konzept.html` | https://claude.ai/code/artifact/3865dd84-8d20-45a3-a542-c639ba2bef61 |
| `dokumente/hosting-setup.html` | https://claude.ai/code/artifact/1204cadc-5830-4d1f-b47b-82aa33865265 |
| **`entwuerfe/daylight.html` (gewaehlt)** | https://claude.ai/code/artifact/1ce703e9-f60e-46b8-8309-910c2b833739 |
| `entwuerfe/sunset.html` | https://claude.ai/code/artifact/fb3580c5-ac02-4d37-b689-c3f9d1277380 |
| `entwuerfe/dunkel.html` | https://claude.ai/code/artifact/47093235-d4e6-4ab0-bd17-79827e7f5857 |

Unterschied: Die Artifact-Fassungen betten `assets/wandbild.jpg` als Base64
ein (veroeffentlichte Seiten muessen in sich geschlossen sein), die
Projektfassung referenziert es ueber `../assets/wandbild.jpg`.

## Harte Fakten (aus Instagram @lumo.mg)
- **Neueröffnung: 03.09.2026** — sehr knapper Zeitrahmen
- Adresse: Krefelder Straße 221, 41066 Mönchengladbach
  (Instagram nennt 219/41065 — vom Betreiber als falsch bestaetigt)
- Eigene Parkplätze direkt vor dem Haus
- Tagline auf der Seite: BRUNCH · CAFÉ · BAR · EVENTS
  (am Gebaeude steht noch BRUNCH · COFFEE · DRINKS · EVENTS)
- Küche: türkisches Frühstück trifft moderne Brunch-Klassiker;
  Lunchangebote, Kuchen & Torten, Matcha-Welt, Signature Cocktails
- Positionierung: "Warm tones. Natural textures. Good coffee."
- Kontakt aus Stellenanzeige: bentos-mg@gmx.de
- Instagram-Bilder sind teils KI-Renderings (als "KI-Inhalte" markiert) —
  für die Website echte Fotos der fertigen Räume besorgen

## Design-System (aus Logo, Fassade, Innenraum abgeleitet)
Dark-first, einthemig — die Marke ist außen schwarz/gold, innen creme/warm.
- Nacht `#0C0B09`, tiefer `#131009`, Karten `#1E180F`
- Gold `#C79A54`, Lichtgold `#E9C88C`, dunkles Gold (auf hell) `#8A6425`
- Creme `#F0E7D8`, gedimmt `#B6A992`, Sand-Sektionen `#EDE2CE`
- Olive `#6E7A55`, Matcha `#8FA36B` (sparsam)
- Display: **Cormorant Garamond** (300/400, weit gesperrte Versalien)
- UI/Body/Labels: **Jost** (300/400/500, uppercase + letterspacing)
- Leitmotiv: der **Sonnenbogen aus dem Logo** wird zum Strukturelement —
  Tagesverlauf von Brunch bis Late Night

## Gestaltung (entschieden)
- Variante **Daylight**: helle Sand-/Cremeflaechen, das Original-Wandbild
  (`assets/wandbild.jpg`, 1835x857) liegt als feste Ebene hinter der
  gesamten Seite, Sektionen darueber unterschiedlich deckend
- Himmelfarbe des Bildes exakt `#F2C88C` -> nahtlose Flaechenverlaengerung
- Bildausrichtung Desktop `88% 50%` cover, Mobil `auto 62vh` unten rechts
- Akzentfarbe auf hell: `#7E5718` (Gold heller waere zu kontrastarm)

## Hosting
- **Gebucht:** ALL-INKL.COM Webspace. `public/.htaccess` ist darauf
  ausgelegt (HTTPS-Zwang, eigene 404, Cache-Header, CSP, Schutz der
  Formular-Zugangsdaten).
- Deployment Stufe 1: Inhalt von `dist/` per FTP ins Webverzeichnis,
  dazu einmalig `formular.config.php` aus der `.example`-Datei anlegen.
- **Nach Eroeffnung:** Hetzner Cloud CX22, ca. 4,50 EUR/Monat + Backups,
  Standort Nuernberg/Falkenstein -> Node fuer Stufe 2.
- Domain + Mail bleiben dauerhaft bei ALL-INKL (SPF/DKIM automatisch)
- Mailadressen: info@, reservierung@, events@, jobs@
- AVV bei beiden Anbietern abschliessen; Vertragsinhaber = Unternehmen

## Zweistufige Umsetzung (entschieden)
- **Stufe 1 — bis 03.09.2026:** vollständige statische Astro-Seite
  (Start, Speisekarte, Events, Feiern, Kontakt, Impressum, Datenschutz),
  Reservierung als Anfrageformular per Mail. Läuft auf jedem Webspace,
  damit die offene Hoster-Frage die Eröffnung nicht blockiert.
- **Stufe 2 — nach der Eröffnung:** Umstellung auf SSR, Datenbank, Login,
  echtes Buchungssystem, Admin-Bereich. Ersetzt das Anfrageformular.

## Entschieden
- **Tech-Stack:** Astro — Stufe 1 statisch, Stufe 2 SSR mit Node-Adapter
- **Struktur:** Hybrid — erzählende Startseite + Unterseiten
  (`/speisekarte`, `/events`, `/events/[slug]`, `/reservieren`, `/feiern`,
  `/kontakt`, `/impressum`, `/datenschutz`, `/admin`)
- **Reservierung:** eigenes Buchungssystem, hybride Bestätigung
  (bis 6 Personen automatisch, ab 7 Personen manuelle Freigabe im Admin)
- **Kapazität:** Platzkontingent pro 30-Minuten-Zeitfenster, kein Tischplan
- **Datenbank:** SQLite als Datei, hinter einer dünnen Zugriffsschicht
  (Wechsel auf PostgreSQL später möglich)
- **Pflege:** Admin-Bereich auf der Seite für Events, Speisekarte,
  Öffnungszeiten, Reservierungen
- **Betrieb:** deutscher Hoster, Auswahl trifft der spätere Betreiber →
  hoster-neutral bauen, alles über `.env`, Deployment per Docker Compose
- **Material:** Logo/CI und professionelle Fotos vorhanden, Texte fehlen noch

## Projektstruktur (Stufe 1)
```
src/data/site.ts      Stammdaten + alle Platzhalter (TODO-Konstante)
src/data/menu.ts      Speisekarte, menuIsPlaceholder-Schalter
src/content/events/   Events als Markdown, je Datei eine Seite
src/styles/           tokens.css (Design-System), base.css
src/components/       Nav, Footer, Section, Sunmark, DayArc,
                      EventCard, MenuList, FormShell, MapConsent,
                      Note, PageHeader, RestaurantSchema
src/layouts/Base.astro   Wandbild-Ebene, Head, Reveal-Skript
public/formular.php   Formularempfang fuer Stufe 1 (laeuft auf jedem
                      Webspace); Zugangsdaten in formular.config.php
                      aus der .example-Datei anlegen, nicht im Repo
```

## Befehle
- `npm run dev` — Entwicklungsserver auf Port 4321
- `npm run build` — statischer Build nach `dist/`
- `npm run check` — Typpruefung (muss 0 Fehler zeigen)
- `npm run check:todo` — listet auf, was vor dem Livegang fehlt;
  Exit-Code 1 solange Blockierendes offen ist

## Regeln fuer die Umsetzung
- Sektionen liegen ueber dem Wandbild: `<Section veil="open|medium|dense|band">`
  — erzaehlende Abschnitte offen, Textabschnitte dicht
- Platzhalter nie direkt in eine Seite schreiben, immer ueber
  `src/data/site.ts` mit der TODO-Konstante, damit check:todo sie findet
- Strukturierte Daten geben Oeffnungszeiten und Telefon nur aus, wenn
  sie echt sind — falsche Zeiten bei Google sind schlimmer als keine
- Kein Drittanbieter laedt automatisch. Google Maps erst nach Klick

## Betriebsdaten (bestaetigt)
- Firma: LUMO Gastro und Event GmbH, Geschaeftsfuehrer Cem Akay
- Telefon 0160 91797206, info@lumo-mg.de
- Oeffnung: Mo Ruhetag, Di-Do 8-22, Fr 8-23, Sa 9:30-23, So 9:30-22
- Durchgehend geoeffnet; 14-17 Uhr Cafe/Bar ohne warme Kueche
- Brunch Di-Fr 8-13, Sa/So 9:30-14 | Mittag Di-Fr 12-14
- Dinner Di-Do+So 17-22, Fr/Sa 17-23

## Offen / noch zu klären
Zwingend vor dem Livegang am 03.09.:
- [ ] Impressumsdaten (Firmierung, Inhaber, HR, USt-IdNr.)
- [ ] Telefonnummer + offizielle E-Mail auf eigener Domain
- [ ] Öffnungs- und Küchenzeiten, Ruhetag
- [ ] Speise- und Getränkekarte (Preise im Entwurf sind erfunden)

Nachlieferbar:
- [ ] Logo als Vektordatei (Sonnen-Ornament ist bisher nachgebaut)
- [ ] Echte Fotos der fertigen Räume
- [ ] Sitzplätze innen/außen, Feier-Kapazität sitzend/stehend
- [ ] Feiern & Mieten: Pakete, Preise öffentlich?
- [ ] Erste Events, insbesondere Opening-Event

Für Stufe 2:
- [ ] Hoster (Node-fähig!) und Domain — klärt der Betreiber
- [ ] Reservierungsregeln (Schwelle manuell, Verweildauer, Zusage)
- [ ] Google-Business-Profil anlegen
- [ ] Technisches Niveau des künftigen Betreibers (Tiefe der Doku)

## Rahmenbedingungen (gesetzt)
- Sprache der Seite: Deutsch
- Mobile first — Gastro-/Local-Business-Traffic ist überwiegend mobil
- Pflichtseiten nach dt. Recht: Impressum (§5 DDG) und Datenschutzerklärung
- Keine externen Ressourcen ohne Consent (Google Fonts lokal einbinden,
  Maps/Instagram-Embeds erst nach Zustimmung nachladen)
- Kein Google reCAPTCHA — Spam-Schutz über Honeypot, Zeitfalle, Rate-Limit
- Ziel: ohne Cookie-Banner auskommen (nur technisch notwendige Admin-Session)
- Löschkonzept: Reservierungen 90 Tage nach Termin anonymisieren,
  Anfragen nach 6 Monaten löschen
- LocalBusiness-/Restaurant-Schema (JSON-LD) + Event-Schema je Veranstaltung
- Hosting-Voraussetzung: Node-fähiger Server (VPS), kein PHP-Shared-Hosting

## Konventionen
- Kommunikation mit dem User auf Deutsch
- Assets unter `assets/`, Seiten im Projektwurzelverzeichnis
