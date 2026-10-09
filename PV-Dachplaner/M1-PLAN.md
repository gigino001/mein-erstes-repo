# PV-Dachplaner – Detailplan Meilenstein M1 (Kern)

Stand: 2026-10-09 · Gehört zu [`PLAN.md`](PLAN.md) (Kap. 14) · Grundlage: Ergebnisse der Spikes in [`spikes/RESULTS.md`](spikes/RESULTS.md) · Status: **Entwurf zur Abstimmung, es gibt noch keinen App-Code**

Aussagen mit **[prüfen]** sind nicht belegt. Alle Zeitangaben sind **Schätzungen**.

---

## 1. Ziel von M1

Ein Außendienstler öffnet die App auf dem iPhone oder am Windows-Rechner, gibt eine Adresse ein, sieht das Luftbild des Hauses, legt die Dachfläche(n) fest, markiert Hindernisse und erhält **nutzbare Fläche, Modulanzahl (hochkant/quer) und Leistung in kWp**. Das Projekt wird auf dem Gerät gespeichert.

**Nicht in M1** (kommt später): PDF (M2), Konten und Teilen (M3), KI-Antippen (M5), Flachdach, Erkennung ohne Antippen. Der Randabstand ist in M1 schon **zuschaltbar**, weil der Rechenkern ihn kann; in `PLAN.md` stand er bei M2, das ist eine bewusste Vorverlegung (kostet fast nichts).

**Erfolgskriterium M1** (messbar):
1. Von der Adresseingabe bis zur Modulanzahl in **unter 5 Minuten** bei einem Haus mit zwei Dachseiten (gemessen mit dir als Testperson auf dem iPhone).
2. Für die Testdächer weicht die Fläche höchstens ±5 % und die Modulanzahl höchstens ±1 Modul je Dachfläche von der Referenz ab, **sobald Referenzdaten vorliegen** (bis dahin: Handrechnung mit den Kernfunktionen aus S4).
3. Kein Absturz bei 30 Minuten Bedienung auf dem iPhone, Projekte gehen nach dem Neuladen nicht verloren.

## 2. Entscheidung von dir: Gebäudedaten (LoD2) schon in M1?

Die Spikes haben gezeigt, dass die Vorverarbeitung der NRW-Dachflächen **billig und fertig prototypisiert** ist (S2). Ohne sie muss der Nutzer Dachfläche, Neigung und Ausrichtung selbst eintragen; mit ihr sind sie für die meisten Häuser sofort da.

| Variante | Inhalt | Aufwand (Schätzung) | Folge |
|---|---|---|---|
| **A (Empfehlung)** | M1 = Zeichnen **und** Vorbelegung aus LoD2 für ein Pilotgebiet (Stadt Bielefeld) | ca. +4 bis 5 Arbeitstage | Spürbar weniger Handarbeit; M4 entfällt als eigener Meilenstein, wird zur Ausweitung auf ganz OWL |
| B | M1 nur Zeichnen, LoD2 später (M4) | ca. 4 bis 5 Arbeitstage weniger | Schneller bei einer ersten Version, aber Neigung und Ausrichtung immer per Hand |

Der Plan unten ist für **Variante A** geschrieben; die Arbeitspakete der LoD2-Anbindung sind mit **(LoD2)** gekennzeichnet und lassen sich für B streichen.

## 3. Festlegungen

| Thema | Entscheidung (Vorschlag) |
|---|---|
| Sprache der App | Deutsch |
| Plattform | PWA (iPhone Safari, Windows Edge/Chrome), eine Codebasis |
| Technik | TypeScript, Vite, **Svelte** (kleines Paket, einfacher Zustand), MapLibre GL JS, proj4, `geometry-core` (fertig) |
| Alternativen | React statt Svelte, falls du das lieber hast; kein Einfluss auf die Funktion |
| Karte | Luftbild von NRW-WMS (JPEG, 512-px-Kacheln, EPSG:3857-Anzeige), direkt aus dem Browser (S1) |
| Rechnen | Alle Geometrie in EPSG:25832 (Meter), Anzeige in 3857/4326 über proj4 |
| Speicherung | Lokal in **IndexedDB** auf dem Gerät, Sicherungsdatei Export/Import (JSON) |
| Hosting | Netlify (eigene Site `pv-dachplaner`), wenige Produktivveröffentlichungen, Entwicklungsstände als Vorschau |
| Cross-Origin-Isolation | **Nicht in M1** (nur die KI braucht sie); sonst Risiko für Karte und Schriften |
| Offline | Nicht nötig; die Programmdateien (App-Hülle) werden dennoch zwischengespeichert, damit die App schnell startet |

## 4. Bildschirme und Bedienung

Bedienung zuerst für **iPhone im Hochformat mit einer Hand**; Windows nutzt dieselbe Oberfläche mit Maus und breiterem Layout (Seitenleiste statt unterem Blatt).

### 4.1 Projektliste

```
┌──────────────────────────────┐
│ PV-Dachplaner        [+ Neu] │
│ ┌──────────────────────────┐ │
│ │ Musterstr. 12, Bielefeld │ │
│ │ 24 Module · 11,04 kWp    │ │
│ │ geändert heute 10:42     │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ …                        │ │
│ └──────────────────────────┘ │
│ [Sicherung exportieren] [⤒]  │
└──────────────────────────────┘
```

- Sortiert nach letzter Änderung, Suche nach Adresse oder Kundenname.
- Wischen oder „⋯“: Duplizieren, Löschen (mit Rückfrage).
- Unten: Sicherung als Datei exportieren und importieren (Ersatz fürs Teilen, bis M3 da ist).

### 4.2 Neues Projekt

- Feld „Adresse“ mit Vorschlägen beim Tippen (Gemeinde zuerst wählen oder mit eintippen, S8).
- Alternativ „Auf Karte wählen“.
- Optional: Kundenname, Notiz.
- Nach der Auswahl springt die Karte zum Haus; das nächstgelegene Gebäude wird markiert und zur **Bestätigung** vorgeschlagen („Dieses Gebäude?“ Ja / Anderes antippen).

### 4.3 Editor (Hauptbildschirm)

```
┌──────────────────────────────┐
│ ‹  Musterstr. 12      ⋯     │
│ ┌──────────────────────────┐ │
│ │      Luftbild            │ │
│ │   ┌────┐ ┌────┐          │ │
│ │   │ D1 │ │ D2 │  ▢ Kamin │ │
│ │   └────┘ └────┘          │ │
│ │                          │ │
│ └──────────────────────────┘ │
│ Bild: 13.08.2024  ⟲ ⟳  🎯   │
├──────────────────────────────┤
│ ▲ D1 Süd 35°   Fläche 61 m²  │  ← unteres Blatt (ausziehbar)
│ 24 Module hochkant · 11 kWp  │
│ [Dach] [Hindernis] [Auswahl] │
└──────────────────────────────┘
```

**Werkzeuge** (Leiste unter der Karte):

| Werkzeug | Verhalten |
|---|---|
| **Auswahl** | Fläche oder Hindernis antippen; Eckpunkte erscheinen als große Griffe (Fläche 44 px) und lassen sich ziehen; Kantenmitte tippen fügt einen Punkt ein; Punkt lange drücken löscht ihn. |
| **Dach** | Eckpunkte nacheinander antippen, mit „Fertig“ oder Antippen des ersten Punkts schließen. Einrasten (Snapping) an vorhandene Ecken und Kanten und an LoD2-Umrisse (Schwelle 0,3 m, abschaltbar). Mehrere Dachflächen je Haus. |
| **Dach aus LoD2 (LoD2)** | Antippen eines Hauses übernimmt dessen Dachflächen samt Neigung und Ausrichtung; jede Fläche bleibt bearbeitbar. |
| **Hindernis** | Standard **Rechteck** (zwei Ecken ziehen, Drehen über Griff), Alternative **Vieleck**. Je Hindernis: Art (Kamin, Dachfenster, Gaube, Antenne/Sat, Lüfter, Sonstiges), „abziehen“ ja/nein, Pufferabstand (aus / 20 cm). |
| **Rückgängig / Wiederholen** | Unbegrenzt innerhalb der Sitzung. |
| **Auf Haus zoomen** (🎯) | Fokus auf die aktuellen Dachflächen. |

**Eigenschaften einer Dachfläche** (Blatt unten, antippen auf „D1“):
- **Neigung**: Pflichtfeld, Schnellwahl 20 / 25 / 30 / 35 / 40 / 45 ° und freie Eingabe; aus LoD2 vorbelegt (LoD2). Ohne Wert zeigt das Ergebnis „Neigung fehlt“ statt einer erfundenen Zahl.
- **Fallrichtung (Ausrichtung)**: Standard aus LoD2; sonst **Traufkante antippen**, die App setzt die Richtung senkrecht dazu nach außen. Zusätzlich Kompassanzeige und Feinjustierung in 5°-Schritten.
- Name (D1, D2 …), Löschen.

**Ergebnisblatt:**
- Dachfläche (Schrägfläche), Randabstand-Verlust, Hindernis-Verlust, **nutzbare Fläche**.
- **Module hochkant / quer** nebeneinander, Hinweis „quer wäre +1“; Auswahl der verwendeten Ausrichtung („beste“ als Option).
- **kWp** (Anzahl × 460 Wp).
- Schalter **Randabstand**: aus / 20 cm / 10 cm („knapp“).
- Summe über alle Dachflächen des Hauses.
- Warnungen: Neigung fehlt; Neigung über 70°; Umriss ungültig (Selbstüberschneidung); Bild älter als 3 Jahre (Befliegungsdatum) oder LoD2-Grundriss älter als das Luftbild („Neubau nach dem Stand möglich“).

**Modulbelegung auf der Karte:** Module als halbtransparente Rechtecke, Nummernzähler je Fläche; „Belegung ausblenden“-Schalter.

### 4.4 Einstellungen

Modulmaße (115 × 178 cm, 460 Wp, Fuge 0), Randabstand-Standardwerte, Einrasten an/aus, Sicherung exportieren/importieren, App-Version, Datenquellen und Lizenzhinweise.

## 5. Datenfluss

```
Adresse ─▶ Adressindex (Gemeinde-Datei) ─▶ Hauskoordinate (EPSG:25832)
                                              │
                         ┌────────────────────┴────────────────────┐
                 Luftbild (WMS, JPEG)                  Dachflächen-Kachel (LoD2) [LoD2]
                         │                                         │
                         └────────────── Editor (Karte) ◀──────────┘
                                              │ Dachflächen + Hindernisse (EPSG:25832, Meter)
                                         geometry-core
                                              │ Fläche, Module, kWp
                                   IndexedDB (Projekt, Autospeichern)
```

- **Adressindex:** Lazy Laden je Gemeinde (S8, in OWL 5 MB gesamt, Bielefeld 0,6 MB).
- **Gebäudewahl:** Punkt im LoD2-Grundriss, sonst nächstes Gebäude bis 30 m; Nutzer bestätigt oder tippt ein anderes an.
- **Befliegungsdatum:** Abfrage der Metadatenebene beim Öffnen des Projekts, im Projekt gespeichert.
- **Autospeichern** nach jeder Änderung (entprellt, ca. 500 ms).

## 6. Datenmodell M1 (lokal)

Entspricht `PLAN.md` Kap. 9, ohne Konten und Teilen:

```
Project   id, name, kunde{name, notiz}, adresse{text, ost, nord}, imageDate, created, updated, version,
          settings{randabstand: 0|0.2|0.1, orientation: hochkant|quer|beste, modul{b,h,wp}}
Building  projectId, quelle{lod2|manuell}, lod2Id?, grundrissStand?
RoofPlane id, projectId, name, typ=geneigt, outline[{x,y}] (EPSG:25832), slopeDeg|null, azimuthDeg|null, quelle
Obstacle  id, roofPlaneId|projectId, art, outline[{x,y}], bufferM, abziehen
```
- Das Rechenergebnis wird **nicht gespeichert**, sondern aus den Eingaben neu berechnet (immer konsistent, kleinere Dateien).
- `version` zählt Änderungen (Vorbereitung auf M3).
- Export/Import als JSON mit Schemaversion; Import prüft das Format und lehnt Unbekanntes ab.

## 7. Technische Bausteine

| Baustein | Aufgabe | Quelle / Vorarbeit |
|---|---|---|
| `geometry-core` | Fläche, Rand, Hindernisse, Belegung | fertig (S4), 59 Tests |
| `coords` | EPSG:25832 ↔ 4326/3857 mit proj4; Prüfung gegen Referenzpunkte | neu |
| `map` | MapLibre-Karte, WMS-Ebene (JPEG 512), Zoom bis 19, Befliegungsdatum | S1 |
| `address` | Gemeinde-Dateien laden, Suchen, Vorschläge | S8 (Prototyp in Python → TypeScript) |
| `editor` | Werkzeuge, Griffe, Einrasten, Rückgängig/Wiederholen | neu, Kern von M1 |
| `lod2` (LoD2) | Kachel holen, Gebäude und Dachflächen auswählen | S2 (`parse_tile.py`, Format `compact`) |
| `store` | IndexedDB, Autospeichern, Export/Import | neu |
| `ui` | Projektliste, Editor-Blatt, Einstellungen | neu |
| `pipeline` (LoD2) | Aufbereitung der Kacheln und Adressindizes, Veröffentlichen | S2/S8 |

**Ordnerstruktur** (Vorschlag): `PV-Dachplaner/app` (Svelte-App), `PV-Dachplaner/packages/geometry-core` (besteht), `PV-Dachplaner/packages/geo-data` (Aufbereitung), `PV-Dachplaner/spikes` (bleibt als Nachweis).

## 8. Aufbereitung der Daten für das Pilotgebiet (LoD2)

- **Pilotgebiet:** Stadt Bielefeld: 293 Kacheln mit Adressen, 3,7 GB Rohdaten, geschätzt 15 bis 73 MB kompakt (S2: 0,18 bis 0,25 MB je dichter Kachel, ländlich weniger). Passt gut auf Netlify.
- **Ablauf:** Skript lädt die Kacheln, berechnet Dachflächen, schreibt je Kachel `E_N.json.gz` im Format aus S2, dazu eine Indexdatei mit Datenstand.
- **Hosting:** Eigene statische Netlify-Site `pv-dachplaner-daten`, damit Daten und App getrennt veröffentlicht werden können (keine neue App-Veröffentlichung bei neuen Daten; jede Veröffentlichung kostet Credits).
- **Aktualisierung:** nach Neulieferung von Geobasis NRW (halbjährlich), wiederholbar mit einem Befehl.
- **Ausweitung auf OWL:** ca. 6.300 Kacheln, 32 GB Download. Läuft über Nacht; Hosting vorher klären (Größe, Dateianzahl, Kontingent).
- **Dateigrößen im Pilot prüfen** und Grenzen von Netlify (Dateianzahl, Gesamtgröße je Veröffentlichung) **[prüfen]**.

## 9. Arbeitspakete (Reihenfolge)

Jedes Paket endet mit einem **Test und einem lauffähigen Stand**. Dauer in Arbeitstagen (AT), Schätzung.

| # | Paket | Ergebnis | AT |
|---|---|---|---|
| 1 | **Projektgerüst**: Vite + Svelte + TypeScript, Lint, Tests (Vitest, Playwright), Einbindung `geometry-core`, Netlify-Vorschau | leere App läuft auf iPhone und Windows | 1 |
| 2 | **Koordinaten und Karte**: proj4, Luftbild-Ebene, Zoom, Befliegungsdatum anzeigen | Karte zeigt NRW-Luftbild, Maßtest gegen S1-Referenz | 1 |
| 3 | **Speicher**: IndexedDB, Projektmodell, Autospeichern, Export/Import | Projekte überleben Neuladen | 1 |
| 4 | **Projektliste und Neues Projekt** ohne Adresssuche (Karte antippen) | Projekt anlegen, öffnen, löschen | 1 |
| 5 | **Editor-Grundlage**: Zeichnen, Auswahl, Griffe, Verschieben, Rückgängig/Wiederholen | Dachfläche zeichnen und ändern | 3 |
| 6 | **Einrasten (Snapping)** und Qualitätswerkzeuge (Kanten einfügen, Punkt löschen) | saubere Umrisse auf dem Handy | 1 |
| 7 | **Eigenschaften und Berechnung**: Neigung, Fallrichtung (Traufkante antippen), Anbindung `geometry-core`, Ergebnisblatt, Modulbelegung auf der Karte | Zahlen wie in S4 | 2 |
| 8 | **Hindernisse**: Rechteck, Vieleck, Art, Puffer, abziehen | Hindernisse reduzieren Fläche und Module | 2 |
| 9 | **Adresssuche**: Aufbereitung, Gemeinde-Dateien, Suche und Vorschläge, Gebäude bestätigen | Von der Adresse zum Haus | 2 |
| 10 (LoD2) | **LoD2-Aufbereitung** für Bielefeld und Veröffentlichung | Datenseite mit Kacheln | 1 |
| 11 (LoD2) | **LoD2 in der App**: Gebäude wählen, Dachflächen übernehmen, Warnungen zum Datenstand | Dachflächen mit Neigung und Ausrichtung | 2 |
| 12 | **Politur**: Fehlermeldungen, Ladezustände, Hilfetexte, PWA-Symbol und Startbild, Service Worker für die App-Hülle | wirkt fertig, Installation auf iPhone | 2 |
| 13 | **Tests und Abnahme**: Ende-zu-Ende-Tests, Gerätetests, Testdächer, Fehlerbehebung | Abnahmeliste unten | 3 |

**Summe: ca. 22 AT mit Variante A (ohne Pakete 10 und 11 ca. 18 AT).** Die ersten drei Pakete sind in kurzer Zeit abgeschlossen; nach Paket 7 ist die App erstmals **für einen echten Testlauf** nutzbar (Dach eintragen, Zahl ablesen).

**Zwischenstände zum Anschauen** (jeweils als Netlify-Vorschau zum Ausprobieren auf dem iPhone): nach Paket 2 (Karte), 5 (Zeichnen), 7 (Rechnen), 9 (Adresse), 11 (LoD2).

## 10. Teststrategie

- **Rechenkern:** besteht (59 Tests). Neu: Beispiele aus echter Bedienung (z. B. Dach mit Hindernis, Randabstand 20 cm).
- **Komponenten** (Vitest): Koordinatenumrechnung gegen bekannte Punkte (Referenz aus S1/S2: Stadionpunkt), Adresssuche (Testliste aus S8), Speicher (Schreiben, Lesen, Export, Import, kaputte Datei).
- **Ende-zu-Ende** (Playwright, Chromium und, wenn möglich, WebKit): Adresse eingeben → Dach zeichnen → Neigung setzen → Hindernis → Ergebnis prüfen → Neuladen → Wert noch da.
- **Geräte** (von dir): iPhone Safari und Windows Edge. Checkliste mit festen Handgriffen (Zoom, Ziehen, Rückgängig, Hochformat/Querformat, Tastatur-Einblendung, Wechsel in andere App und zurück).
- **Leistung:** Berechnung nach jeder Änderung höchstens 200 ms spürbar (Rechenkern 50 ms in Node; iPhone zu messen), Karte bleibt flüssig, Start bis nutzbar unter 3 s bei zweitem Aufruf.
- **Barrierefreiheit** (Basis): Kontrast hell/dunkel, Zielgrößen mindestens 44 px, Beschriftungen für Schaltflächen.
- **Referenzdächer:** sobald Daten vorliegen, Vergleichsliste (Tool gegen Angebot/Aufmaß) mit Abweichungen; bis dahin Handrechnungen.

## 11. Abnahmeliste M1

- [ ] Adresse in Bielefeld eingeben → richtiges Haus vorgeschlagen → bestätigt.
- [ ] Luftbild zeigt Befliegungsdatum; Zoom bis Stufe 19 ohne Ruckeln.
- [ ] Dachfläche zeichnen, verschieben, Punkt hinzufügen/löschen, Rückgängig.
- [ ] LoD2 (A): Haus antippen übernimmt Dachflächen mit Neigung/Ausrichtung, jede Fläche änderbar.
- [ ] Neigung und Fallrichtung eintragen (Traufkante antippen); Ergebnis erscheint.
- [ ] Hindernis (Rechteck, Vieleck) einzeichnen, abziehen, Puffer; Ergebnis ändert sich nachvollziehbar.
- [ ] Randabstand aus / 20 cm / 10 cm ändert Fläche und Modulzahl.
- [ ] Module hochkant und quer sichtbar und nebeneinander gezählt; kWp stimmt (Anzahl × 460 Wp).
- [ ] Summe über mehrere Dachflächen stimmt.
- [ ] Projekt bleibt nach Neuladen und Neustart erhalten; Export/Import funktioniert.
- [ ] Warnungen: Neigung fehlt, Bild alt, Datenstand abweichend.
- [ ] Installierbar auf dem iPhone-Home-Bildschirm; läuft im Hoch- und Querformat.
- [ ] Mindestens 3 Testdächer (verschiedene Formen) gegen Handrechnung ±1 Modul.

## 12. Risiken in M1 und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| **Zeichnen mit dem Finger ist fummelig** | Große Griffe, Lupe beim Ziehen (Vergrößerung neben dem Finger), Einrasten, Rückgängig; früh auf dem iPhone testen (Zwischenstand nach Paket 5) |
| LoD2 passt nicht zum Haus (Beispiel A in S6) | Dachfläche immer bearbeitbar; Warnung bei abweichendem Stand; manuelles Zeichnen als Standardweg |
| Neigung unbekannt | Pflichtfeld, kein stilles Standardwert; später Neigungsmessung mit dem iPhone-Sensor (Idee, nicht M1) |
| Berechnung zu langsam auf dem iPhone | Messung in Paket 7; Berechnung entprellen und im Hintergrund-Thread (Web Worker) ausführen |
| Netlify-Credits | Wenige Produktivveröffentlichungen; Daten auf eigener Site; Verbrauch zu Beginn jeder Woche prüfen |
| Datenmenge Netlify (Kacheln) | Pilotgebiet Bielefeld (max. ca. 73 MB); Größe und Dateianzahl im Paket 10 prüfen, sonst Cloudflare R2 |
| Safari-Besonderheiten (Speicher kann vom System geleert werden) | Export-Erinnerung („Sicherung seit 14 Tagen nicht erstellt“); Persistenz anfordern (`navigator.storage.persist`) |
| Lizenz der Hauskoordinaten (ASCII) | Vor dem Rollout auf der Datensatzseite klären (siehe S8) |

## 13. Offene Entscheidungen für dich

1. **LoD2 schon in M1** (Variante A, empfohlen) oder erst später (B)?
2. **Svelte oder React?** Mein Vorschlag Svelte; für die Funktion egal. Wenn später jemand außer mir die App pflegen soll, ist React verbreiteter.
3. **App-Name und Adresse** (Netlify-Name `pv-dachplaner` ist ein Arbeitstitel). Soll es einen eigenen Namen oder eine eigene Domain geben?
4. **Haftungshinweis** in der App: einverstanden mit dem Text aus `PLAN.md` Kap. 11 als Startversion?
5. **Zwischenstände**: Soll ich dir nach jedem der genannten Zwischenstände eine Vorschau-Adresse schicken, damit du sie auf dem iPhone ausprobierst?

Nach deiner Antwort auf 1 und 2 beginne ich mit Paket 1.
