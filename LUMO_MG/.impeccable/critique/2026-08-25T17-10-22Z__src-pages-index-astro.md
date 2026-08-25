---
target: Startseite
total_score: 20
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 3
timestamp: 2026-08-25T17-10-22Z
slug: src-pages-index-astro
---
Method: dual-agent (A: aa59521cc0d531f1e · B: a2bb4436c5c68da77)

## Design Health Score

| # | Heuristik | Score | Kernproblem |
|---|---|---|---|
| 1 | Sichtbarkeit des Status | 2 | Kein `aria-current` in der Navigation; „Karte laden" ohne Zwischenzustand |
| 2 | System ↔ reale Welt | 2 | CTA „Tisch reservieren" führt zu „Anfrage senden"; DayArc verspricht „bis 23 Uhr" an Tagen mit Schluss um 22 |
| 3 | Kontrolle & Freiheit | 3 | Karte laden ist irreversibel (`replaceChildren`) |
| 4 | Konsistenz & Standards | 3 | Drei Buttonvarianten ohne erkennbares System; „Karte" bedeutet viererlei |
| 5 | Fehlervermeidung | 2 | Ruhetag Montag nirgends genannt; Reservierungsformular lässt Termine vor Eröffnung und montags zu |
| 6 | Wiedererkennen statt Erinnern | 2 | Countdown blendet das Eröffnungsdatum aus |
| 7 | Flexibilität & Effizienz | 1 | Kein persistenter Reservieren-Weg auf 9288 px Mobilseite |
| 8 | Ästhetik & Minimalismus | 3 | 11 sichtbare Platzhalter-Hinweise |
| 9 | Fehler erkennen & beheben | 2 | Scheitert das Reveal-Modul, sind 92 % des Inhalts dauerhaft unsichtbar |
| 10 | Hilfe & Dokumentation | n/a | Landingpage ohne erlernbare Funktion |
| **Summe** | | **20/36** | **Acceptable (56 %)** |

## Design-Spezifität

Halb autorenschaftlich. Spezifisch: Wandbild als feste Ebene mit gemessener Himmelfarbe `#f2c88c`, DayArc als Bézier-Kurve aus der Wortmarke, nachgebautes Sonnen-Ornament, Matcha mit eigenem Token. Austauschbar: Hero-Aufbau, Zickzack-Sektionsfolge ohne Bruch, Headlines wie „Ein Ort, der den ganzen Tag trägt", Button- und Pill-Kit.

Deterministischer Scan: CLI 0 Befunde (Exit 0, gegengeprüft mit Probe-Datei). Im Browser injiziert: 48 Elemente, 73 Treffer über 8 Regeln. Echte Befunde: `--ink-faint` bei 4,0:1 (7×, an 15 Stellen verwendet), `--ink-soft` auf Sandband 4,4:1, 13 Textstellen unter 10 px, `transition: padding` auf der klebenden Kopfzeile. Falsch-positiv: figcaption-Kontraste (Messartefakt über Fotos), cream-palette, repeating-stripes, kicker-above-heading, radial-spotlight-glow.

## Prioritätsprobleme

**[P1] Der Kunstgriff der Seite macht ihren Text unlesbar.** 22 % der Bildfläche liegt unter L=0,12. Über diesen Partien: `.copy p` bei `veil="open"` 2,05–2,72:1, `.label` 2,01–2,66:1, `.event__meta` 2,39–2,64:1. Betroffen sind `#tag`, `#matcha`, `#feiern` — die drei erzählenden Sektionen. Fix: Textspalte eigene dichte Fläche geben statt globale Deckkraft zu erhöhen.

**[P1] Kein einziges Wort zu Öffnungszeiten.** Null Treffer für „geöffnet", „Ruhetag", „Montag" im Text. Die bestätigten Zeiten liegen fertig in `site.ts` und werden auf der Startseite nie verwendet. Der DayArc suggeriert Sieben-Tage-Betrieb.

**[P1] Der DayArc ist unter 900 px unbenutzbar.** `min-width: 820px` in 335 px Container. Sichtbar: „Brunch" und halb „Lunch". Stationsboxen überlappen sich um bis zu 43 px, auch auf Desktop. Kein `tabindex`, per Tastatur nicht erreichbar.

**[P2] Der Hero verschluckt das Eröffnungsdatum.** `fallback.hidden = true` ersetzt „Donnerstag, 3. September 2026" durch den Ticker. Erste Nennung im Text: Zeichen 3438 von 3778.

**[P2] Elf Mal „das hier ist nicht echt", 9 Tage vor Eröffnung.** 6 Demobild-Badges, 3 Beispiel-Marker, 2 Platzhalter-Hinweise. Jedes Foto des Hauses als unecht gekennzeichnet.

## Persona-Warnsignale

**Jordan (First-Timer):** Countdown ohne Datum, H1 ist „LUMO" ohne Aussage, Positionierung bei 12,48 px unterhalb der Aufmerksamkeitsschwelle, elf Unecht-Hinweise, keine Öffnungszeiten, kein Fremdbeleg.

**Riley (Stress-Tester):** Bucht Termine vor der Eröffnung und montags; kein Fokus-Trap im Drawer; blockiertes Modul-Skript macht 3474 von 3778 Zeichen unsichtbar; Karte laden nicht zurücknehmbar.

**Casey (Mobil):** Ghost-Button „Zur Karte" steht auf dem Foto bei 1,21:1; DayArc abgeschnitten; Burger 38×29 px; 13 Footer-Links mit 5,6 px Abstand; 9288 px ohne persistenten CTA.

## Kleinere Beobachtungen

`{site.parking.toLowerCase()}` erzeugt „eigene parkplätze direkt vor dem haus". `.facts dd` bei 3,9:1 bricht, sobald echte Kapazitäten kommen. `.pills` sehen aus wie `.btn--ghost`, tun aber nichts. `.section--band` mit 88 % lässt das Motiv durch. `preserveAspectRatio="none"` verzerrt das Markenmotiv. Drift-Animation läuft auch auf Mobil.

## Fragen

Was ist der eine Job dieser Seite in den Tagen bis zum 3. September? Instagram-Follower und E-Mail-Erinnerung werden nie gefragt. Der Sonnenbogen ist als Leitmotiv gesetzt, kommt einmal vor, und die Mehrheit kann ihn nicht sehen. Welche zwei der sechs Sektions-CTAs würdet ihr behalten?
