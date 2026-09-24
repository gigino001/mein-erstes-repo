# coco lashes — Projektplan neue Homepage

Stand: 24.09.2026 · Inhaberin: Claudia Gajda · Studio: Gerichtstraße 13, 33602 Bielefeld

## 1. Ausgangslage

- Bestehende Buchungsseite: https://cocolashesbielefeld.simplybook.it/v2/ (bleibt vorerst als Fallback/Referenz, wird perspektivisch durch eigenes Buchungssystem ersetzt)
- Bestehendes Projekt in diesem Repo: eine eigenständige PWA "Lash Preview" (Kamera-basierte, clientseitige Gesichtsanalyse via MediaPipe + Stil-Empfehlung, Leistungen, Kontakt, Verlinkung zu SimplyBook). **Bleibt vorerst separat bestehen**, wird nicht in die neue Homepage integriert. Repo-technisch bleibt sie an ihrem aktuellen Ort (Root: `index.html`, `css/`, `js/`, `manifest.json`, `sw.js`); die neue Homepage entsteht in einem eigenen Unterordner `website/`.
- Ziel: eine neue, eigenständige, moderne Marketing-Homepage + ein maßgeschneidertes Echtzeit-Reservierungssystem.

## 2. Markenkern (aus dem Gespräch mit dem Kunden)

- Nicht nur Wimpern: Kundinnen kommen auch wegen Claudia selbst — "fühlt sich manchmal an wie eine Psychologin". Vertrauen, Wohlfühlmoment, ehrliche Gespräche.
- Jedes Wimpernset wird individuell im Gespräch besprochen und angefertigt — kein Fließband, kein "alle sehen gleich aus".
- Anspruch: modern, seriös, professionell — aber mit Persönlichkeit, nicht steril.

## 3. Design-Richtung (final abgestimmt)

**Farben** (Kunde hat konkrete Hex-Werte vorgegeben, Umsetzung mit mehr Mut/Kontrast als Standard-Beauty-Pastell):

| Rolle | Farbe | Hex |
|---|---|---|
| Hintergrund | White | `#FFFFFF` |
| Fläche/Karten | Sky Mist | `#EAF4F8` |
| Akzent warm | Coral | `#FF9398` |
| Akzent warm, hell | Coral Soft | `#FFDCDD` |
| Akzent CTA/Links | Ocean Blue | `#2779A7` |
| Text | Ink Navy | `#16232B` |

**Typografie** — drei Stimmen:
- **Anton** (fett, condensed, Caps) — große Statements, Headlines, Zahlen. Liefert die "mutige Plakat-Energie" (Inspiration: dontboardme.com)
- **Fraunces** (Kursiv) — Claudias persönliche Stimme: Zitate, "Über mich", emotionale Momente
- **Work Sans** — Fließtext, Formulare, UI

**Stilprinzipien:**
- Mutige Vollton-Farbflächen statt zarter Verläufe/Pastelltöne
- Große, selbstbewusste Typo, die auch mal an den Rand geht
- Direkter, warmer Text-Ton — nicht brav-verkäuferisch
- Fotoplatzhalter dort, wo später echte Fotos (Studio, Vorher/Nachher, Claudia) reinkommen

**Bewegung im Design — scroll-gesteuert, kein Klick-Slider:**
- **Vorher/Nachher-Galerie:** horizontaler Bilderstreifen, der sich **an die Scroll-Position gekoppelt** seitlich bewegt (man scrollt normal runter, die Bilder wandern dabei horizontal durch) — kein Klicken/Swipen nötig
- **Kundinnenstimmen:** Zitate blenden sanft ein/gleiten hoch, sobald sie beim Scrollen in den Sichtbereich kommen (kein Pfeil-Slider)
- Dezenter Parallax-Effekt auf Hero-/Sektionsfotos (bewegen sich leicht langsamer/schneller als der Rest beim Scrollen)
- Technisch: **Framer Motion** (`useScroll`/`useTransform`) bzw. native CSS-Scroll-Animationen für die scroll-gekoppelten Transformationen — kein Embla/Klick-Carousel; alles respektiert `prefers-reduced-motion` (Bewegung wird dann deaktiviert/reduziert)

→ Referenz-Moodboard: siehe Artifact (im Chat verlinkt), Farben/Typo dort final abgenickt.

## 4. Content (bereits gesammelt)

**Kontakt & Standort**
- Telefon/WhatsApp: +49 176 43456902
- E-Mail: cocolashes-bielefeld@gmx.de
- Instagram: @cocolashesbielefeld
- Adresse: Gerichtstraße 13, 33602 Bielefeld
- Domain (Wunsch): cocolashes-bielefeld.de

**Öffnungszeiten**
| Tag | Zeit |
|---|---|
| Mo–Do | 10:00–20:00 |
| Fr | 10:00–16:00 |
| Sa/So | Ruhetag |

**Team**
- Aktuell: Claudia Gajda allein (Homestudio)
- Wichtig: Datenmodell wird **mehrstaffel-fähig** gebaut (Erweiterung um Mitarbeiterinnen geplant), auch wenn zum Start nur ein Kalender aktiv ist.

**Bio-Basistext (Claudia, wird für "Über mich" ausgebaut)**
> "Hi! Ich bin Claudia, Deine Ansprechpartnerin für deinen perfekten Augenaufschlag. In meinem Homestudio biete ich Dir hochwertige Wimpernverlängerungen an, die Deinen individuellen Look unterstreichen. Ob natürlich dezent oder dramatisch voluminös – ich nehme mir Zeit für Dich und berate Dich persönlich, um Deine individuellen Wünsche umzusetzen. Mit viel Liebe zum Detail, professionellen Techniken und erstklassigen Produkten sorge ich für langlebige Ergebnisse und den ultimativen Wohlfühlmoment."

Für die neue Seite ausgebaut um die "Psychologin"-Geschichte und den Individualitäts-Anspruch (KI-Vermessung wird als **Story/Erzählung** eingebaut, nicht als technische Funktion auf der neuen Seite — die echte Beratung passiert persönlich vor Ort).

**Leistungen & Preise**

*Neumodellage (Erstbehandlung):*
| Leistung | Dauer | Preis |
|---|---|---|
| Neumodellage 1:1 (Classic) | 1 Std. 30 | 80 € |
| Neumodellage Light Volumen | 1 Std. 30 | 90 € |
| Neumodellage Mega Volumen | 1 Std. 30 | 100 € |
| Bloom Eyes Neumodellage (Wispy/Wet, Farbe wählbar) | 2 Std. | 95 € |

*Auffülltermine:*
| Leistung | Dauer | Preis |
|---|---|---|
| Auffüllen 1:1 (2–3 Wochen) | 1 Std. | 40 € |
| Auffüllen 1:1 (3–4 Wochen) | 1 Std. | 50 € |
| Auffüllen Light Volumen (2–3 Wochen) | 1 Std. | 50 € |
| Auffüllen Light Volumen (3–4 Wochen) | 1 Std. | 60 € |
| Auffüllen Mega Volumen (2–3 Wochen) | 1 Std. | 60 € |
| Auffüllen Mega Volumen (3–4 Wochen) | 1 Std. | 70 € |
| Bloom Eyes Auffüllen (2–3 Wochen) | 1 Std. | 55 € |
| Bloom Eyes Auffüllen (3–4 Wochen) | 1 Std. | 65 € |

*Sonstiges:*
| Leistung | Dauer | Preis |
|---|---|---|
| Wimpern entfernen | 30 min | 10 € |
| Modellarbeit (Model gesucht) | 2 Std. | 50 € |

**Rechtliches (Deutschland, Pflicht):**
- Impressum
- Datenschutzerklärung (insb. wegen Buchungsdaten, evtl. Kundenfotos)

## 5. Technik-Setup

- **Framework:** Next.js (React) für Frontend + Backend zusammen
- **Datenbank:** MariaDB/MySQL via Prisma ORM (statt Postgres — Anpassung an ALL-INKL, das standardmäßig MySQL/MariaDB mitliefert; Prisma abstrahiert das, kaum Codeänderung nötig)
- **Hosting:** ALL-INKL.COM — **offen:** welches Paket (Privat/PrivatPlus/Business/Premium)? Node.js-Hosting per Passenger gibt es bei ALL-INKL erst ab Business/Premium. Das brauchen wir spätestens vor dem Deploy (Phase 4), nicht für die lokale Entwicklung.
- **Buchungssystem:** eigenes Echtzeit-System (ersetzt SimplyBook), unverbindliche Terminbuchung ohne Online-Zahlung
- **Sprache:** Deutsch (Annahme — lokales Studio in Bielefeld; sag Bescheid falls doch zweisprachig DE/EN gewünscht, wie bei der bestehenden Preview-App)

### Datenmodell (Entwurf)

- `Staff` — id, Name, aktiv, Foto (vorbereitet für mehrere Mitarbeiterinnen)
- `Service` — id, Name, Kategorie, Dauer (Min.), Preis, Beschreibung
- `Availability` — Arbeitszeiten je Staff & Wochentag, Ausnahmen/Urlaub
- `Appointment` — Kundin (Name, E-Mail, Telefon), Service, Staff, Start/Ende, Status (angefragt/bestätigt/storniert), Notiz
- Einfaches Admin-Login für Claudia: Termine einsehen/verwalten, Zeiten blocken, Leistungen pflegen

## 6. Seitenstruktur

1. **Start** — Hero (große Plakat-Headline + Foto-Platzhalter), Kurzvorstellung, Highlights (individuelle Beratung, Wohlfühlmoment), CTA "Termin buchen"
2. **Über mich** — Claudias Geschichte, Philosophie, "wie eine Psychologin"-Erzählung, Individualitäts-Versprechen
3. **Leistungen & Preise** — vollständige Liste (siehe oben)
4. **Galerie** — Vorher/Nachher als Slider, Studio-Impressionen (Platzhalter bis echte Fotos da sind)
5. **Kundinnenstimmen** — Zitat-Slider (Testimonials)
6. **Termin buchen** — eigenes Echtzeit-Buchungssystem
7. **Kontakt** — Karte, Kontaktdaten, Öffnungszeiten, Social Links
8. **Impressum / Datenschutz** — Footer-Links

Optional: dezenter Verweis/Link auf die bestehende Lash-Preview-App als Bonus-Feature ("Neugierig? Probier unsere Wimpern-Vorschau aus") — nur falls gewünscht, keine technische Integration.

## 7. Bauphasen

1. **Setup:** Next.js-Projekt in `website/`, Prisma-Schema, Grundkomponenten (Farben/Typo aus Moodboard), Deploy-Pipeline, SEO-Grundgerüst (sitemap.xml, robots.txt inkl. KI-Crawler, Meta-Framework, Schema.org-Basis)
2. **Marketing-Seiten:** Start, Über mich, Leistungen, Kontakt, FAQ, Impressum/Datenschutz — mit den echten Inhalten oben, Platzhaltern für Fotos, je Seite eigene Meta-Daten + strukturierte Daten
3. **Buchungssystem:** öffentlicher Buchungsflow + einfaches Admin-Dashboard für Claudia
4. **Feinschliff:** Responsive/Mobile-Test, Performance/Core-Web-Vitals, SEO-Audit, Deploy auf ALL-INKL, Launch

## 8. SEO &amp; KI-Auffindbarkeit (von Anfang an mitgedacht, nicht nachträglich)

Ziel: bei Google gut ranken **und** von Chat-KIs (ChatGPT, Claude, Perplexity, Gemini &amp; Co.) als Antwort/Empfehlung genannt werden, wenn jemand z. B. "Wimpernstudio Bielefeld" fragt.

**Technisches SEO (Next.js macht das meiste automatisch möglich, aber es muss aktiv genutzt werden):**
- Server-seitig gerenderte/statische Seiten (SSG/ISR), kein Content, der nur per Client-JS nachlädt — sowohl klassische Crawler als auch die meisten KI-Crawler führen kein JavaScript aus
- Saubere semantische HTML-Struktur (eine `h1` pro Seite, sinnvolle Überschriften-Hierarchie, `nav`/`main`/`footer`)
- Individuelle Meta-Title/-Description pro Seite, Open-Graph- &amp; Twitter-Card-Tags fürs Teilen
- `sitemap.xml` und `robots.txt` (Google, Bing **und** KI-Crawler wie `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` bewusst zulassen statt blocken — sonst kann keine KI die Seite zitieren)
- Optional ein `llms.txt` im Root, das Studio, Leistungen und Kontakt in einfacher Textform für KI-Systeme zusammenfasst (neue, sich etablierende Konvention)
- Aussagekräftige Alt-Texte für alle Bilder, gute Core-Web-Vitals (schnelle Ladezeit, auch mobil)

**Strukturierte Daten (Schema.org) — zentral für lokale Auffindbarkeit:**
- `LocalBusiness`/`BeautySalon`-Markup mit Name, Adresse, Telefon, Öffnungszeiten, Geo-Koordinaten, Preisklasse
- `Service`-Markup je Leistung (Name, Dauer, Preis)
- `FAQPage`-Markup für eine echte FAQ-Sektion

**Content, den KIs gerne zitieren (Antwort-Engine-Optimierung):**
- Eine FAQ-Sektion/-Seite mit natürlich formulierten Fragen &amp; klaren Antworten, z. B. "Was kostet eine Wimpernverlängerung in Bielefeld?", "Wie lange hält eine Wimpernverlängerung?", "Was ist der Unterschied zwischen Classic, Light und Mega Volumen?", "Muss ich vor dem Termin etwas beachten?" — genau dieses Frage-Antwort-Format wird von Chat-KIs bevorzugt extrahiert und zitiert
- Klare, faktenbasierte Texte statt reiner Marketing-Floskeln (Claudias Erfahrung, Ausbildung/Zertifikate falls vorhanden, seit wann sie das macht) — stärkt Glaubwürdigkeit, die auch KIs für Empfehlungen gewichten
- Konsistente NAP-Daten (Name, Adresse, Telefon) exakt gleich auf Website, Google Business Profil und Instagram — Unstimmigkeiten schaden sowohl Google-Ranking als auch KI-Vertrauen

**Off-Page (nicht Teil des Website-Baus, aber wichtig — als Empfehlung an die Kundin):**
- Google Business Profil anlegen/pflegen (falls noch nicht vorhanden) mit identischen Daten
- Google-Bewertungen sammeln — Bewertungen fließen sowohl ins klassische Local-SEO als auch zunehmend in KI-Empfehlungen ein
- Eintrag in gängigen Branchenverzeichnissen mit identischen NAP-Daten

→ Das fließt von Phase 1 an in Setup (Sitemap/robots.txt/Schema-Grundgerüst) und Phase 2 (Seiteninhalte inkl. FAQ-Sektion) ein, nicht erst als Nachgedanke in Phase 4.

## 9. Baustand

Umgesetzt in `website/` (lokal, noch nicht deployed): Next.js-Setup mit dem
Design-System (Farben/Typo aus dem Moodboard), Startseite inkl.
scroll-gekoppelter Galerie und Scroll-Fade-Sektionen, Leistungen (aus der
Datenbank), Über mich, Kontakt (mit Kartenausschnitt), FAQ (mit
FAQPage-Schema), Impressum/Datenschutz (Entwürfe, siehe Hinweise in den
Dateien), SEO-Grundgerüst (Sitemap, robots.txt inkl. KI-Crawler,
LocalBusiness-Schema), sowie ein funktionierendes Buchungssystem
(Verfügbarkeits-Berechnung gegen Arbeitszeiten + bestehende Termine,
Terminanfrage-Formular, ohne Online-Zahlung). Lokal getestet: Build, Lint
und der komplette Buchungsablauf laufen fehlerfrei durch.

Seitdem ergänzt: passwortgeschützter Admin-Bereich (`/admin`) — Claudia
kann Terminanfragen bestätigen/absagen und Zeiten (Urlaub, Feiertage)
blockieren, die dann automatisch nicht mehr buchbar sind. Login per
bcrypt-gehashtem Passwort + signierter Session (JWT/Cookie), Schutz per
Next.js Proxy (optimistischer Redirect) und serverseitiger Prüfung in
jeder Aktion.

Noch offen: echte Fotos statt Platzhalter, Galerie-Inhalte,
E-Mail-Benachrichtigung bei neuen Anfragen, Umstellung auf MySQL/MariaDB
und Deploy auf ALL-INKL.

## 10. Offene Punkte

- ALL-INKL-Paket (Privat/PrivatPlus/Business/Premium) — nötig vor Deploy, nicht vor Entwicklungsstart
- Echte Fotos (Studio, Claudia, Vorher/Nachher) — Platzhalter bis dahin
- Ob ein dezenter Link zur bestehenden Lash-Preview-App gewünscht ist
- Inhalte für die FAQ-Sektion final abstimmen (Vorschläge kommen von mir, Claudia kann ergänzen/ändern)
- Ob ein Google Business Profil bereits existiert oder neu angelegt werden muss
