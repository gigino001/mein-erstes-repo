# Spesen App

Arbeitszeit, Verpflegung, Belege und Stundenkonto als offline-fähige PWA. Daten liegen nur lokal (IndexedDB).

## Entwicklung
```
npm install
npm run dev        # Entwicklungsserver
npm test           # Rechenlogik (Vitest)
npm run build      # Typprüfung + Produktions-Build inkl. Service Worker
```

## Aufbau
- `src/domain/` Rechenlogik ohne UI (Soll/Ist, Verpflegung, Feiertage NRW, Stundenkonto) mit Tests
- `src/db/` Dexie-Schema (Einstellungen, Tage, Belege, Timer, Buchungen, Händlerregeln)
- `src/export/` PDF (pdf-lib), Excel (write-excel-file) und CSV
- `src/backup/` Sicherung und Wiederherstellung (JSON inkl. Belegfotos)
- `src/ocr/` Bildaufbereitung und Offline-Texterkennung (Tesseract)
- `src/ui/` React-Oberfläche
- `src/styles/` Design-Tokens (hell/dunkel)

## Regeln
- Soll 8 h pro Tag, Mo–Fr, Feiertage NRW
- Verpflegung 14 € nur an Arbeitstagen und nur bei mehr als 8 h Arbeitszeit (also ab 8:01), nie bei Urlaub, Krank, Abfeiern oder Feiertag (Betrag und Schwelle einstellbar)
- Stundenkonto: Arbeitstage buchen Ist minus Soll (weniger als 8 h mindert die Überstunden), Urlaub, Krank und Feiertag erfüllen das Soll, Abfeiern zieht das Soll ab (halber Tag 4 h)
- Zeiten auf 15 Minuten gerundet
- Mail-Betreff: „Spesen Adriano Falcone"

## Export
Die Abrechnung entsteht pro Monat als PDF (Zusammenfassung, Tagesübersicht, Belegübersicht, Belegfotos), Excel oder CSV.
Teilen und Mail laufen über das Teilen-Menü des Geräts (Web Share API); am Desktop werden die Dateien heruntergeladen.

## Sicherung
Die Daten liegen nur lokal (IndexedDB). Unter Einstellungen → Daten erstellst du ein Backup (Teilen-Menü oder Download) und stellst es wieder her.
Nach 30 Tagen ohne Sicherung erinnert die App auf dem Heute-Tab.

## Deploy
Netlify: Base directory `Spesen-App`, Build `npm run build`, Publish `dist` (steht in `netlify.toml`).
