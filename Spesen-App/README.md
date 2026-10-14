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
- `src/ui/` React-Oberfläche
- `src/styles/` Design-Tokens (hell/dunkel)

## Regeln
- Soll 8 h pro Tag, Mo–Fr, Feiertage NRW
- Verpflegung 14 € ab 8 h Arbeitszeit (einstellbar)
- Zeiten auf 15 Minuten gerundet
- Mail-Betreff: „Spesen Adriano Falcone"

## Deploy
Netlify: Base directory `Spesen-App`, Build `npm run build`, Publish `dist` (steht in `netlify.toml`).
