# PV-Dachplaner

Kostenlose PWA (iPhone + Windows) zur PV-Dachplanung in NRW: Dachflächen auf dem Luftbild zeichnen, Hindernisse abziehen, Module (115 × 178 cm, 460 Wp) platzieren, Strings planen und als PDF/CRM-Paket exportieren. Svelte 5 + Vite + TypeScript, MapLibre, alles im Browser (keine Server, keine Konten).

Live-Version: <https://pv-dachplaner.netlify.app>

## Lokal starten

Voraussetzung: Node.js 22 oder neuer.

```bash
git clone https://github.com/gigino001/mein-erstes-repo.git
cd mein-erstes-repo
git checkout claude/pv-dachplaner-plan      # solange der Stand nicht auf main ist
cd PV-Dachplaner/app
npm install                                  # holt auch packages/geometry-core (file:-Abhängigkeit)
npm run dev                                  # http://localhost:5173
```

Weitere Befehle (im Ordner `app`):

| Befehl | Zweck |
|---|---|
| `npm test` | Unit-Tests (Vitest) |
| `npm run check` | Typprüfung (svelte-check) |
| `npm run build` | Produktionsbuild nach `dist/` |
| `npm run e2e` | Ende-zu-Ende-Tests (Playwright, Chromium; braucht `npm run build` und `npm run preview` im Hintergrund, Adresse per `BASE=…` änderbar) |

## Adresssuche (Daten fehlen im Repository)

Die Hauskoordinaten für die Adresssuche liegen in `app/public/daten/adressen/` (ca. 14 MB) und sind nicht im Repository (`.gitignore`). Ohne diesen Ordner läuft die App, nur die Adresssuche findet nichts; man kann dann direkt auf der Karte arbeiten. Zwei Wege:

1. Den Ordner `daten` vom Weitergebenden bekommen und nach `app/public/` kopieren.
2. Neu erzeugen: siehe `packages/geo-data/README.md` (Download der Gebäudereferenzen von opengeodata.nrw.de, Skript `build_adressen.py`). Lizenzhinweis dort beachten.

## Aufbau

```
app/                      PWA (src/lib: Modell, Berechnung, Strings, Geräte, Export; src/lib/editor: Karte/Zeichnen; src/views)
packages/geometry-core/   Geometrie (Dachebene, Modulraster, Clipper) – rein TypeScript
packages/geo-data/        Aufbereitung der NRW-Geodaten
spikes/                   frühere Technikversuche (Luftbild, LoD2, KI im Browser) mit Ergebnissen
PLAN.md, M1-PLAN.md, M2-PLAN.md, SPIKES.md   Planung, Entscheidungen, Stand
```

## Wichtige Eigenschaften

- Alle Projektdaten und eigene Geräte (Module/Wechselrichter) liegen im Browser (IndexedDB bzw. localStorage). Austausch über „Sicherung“ in der Projektliste (JSON) und „Eigene Geräte sichern“ unter „Geräte“.
- Stringplanung: gleich lange Strings je Dachfläche (mathematisch blockiert), Zwei-Gruppen-Vorschläge, Strings von Hand per Antippen der Module, MPPT-Zuordnung. Geräteliste mit Datenblattwerten in `app/src/lib/geraete.ts`; daraus werden Min/Max-Stringlängen berechnet (−10 °C / +70 °C).
- Luftbild: WMS von Geobasis NRW (`wms_nw_dop`), Rechnen in EPSG:25832.
- Stand und offene Punkte: `M2-PLAN.md` (unten) und `M1-PLAN.md`.

## Deployment (Netlify)

Statische Seite: `npm run build`, Inhalt von `app/dist/` hochladen (Sourcemaps `dist/assets/*.map` vorher löschen). Jede Veröffentlichung kostet auf dem kostenlosen Netlify-Tarif Credits; ein eigenes Konto reicht.
