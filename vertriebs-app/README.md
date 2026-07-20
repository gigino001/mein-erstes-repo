# PV & Wärmepumpe Vertriebs-App

Web-App für den Vertrieb von Photovoltaik- und Wärmepumpenanlagen: Kundenverwaltung, geführte Datenerfassung, automatische Dimensionierung/Wirtschaftlichkeitsberechnung, Kostenkalkulation und PDF-Angebote. Responsive für Desktop, Tablet und iPhone, als PWA installierbar.

## Setup

```bash
npm install
cp .env.example .env    # ggf. AUTH_SECRET anpassen (openssl rand -base64 32)
npx prisma generate
npx prisma migrate dev
npm run db:seed         # legt Admin-Login, Beispiel-Komponenten & Beispielkunde an
npm run dev
```

App läuft danach unter http://localhost:3000. Seed-Login: `admin@firma.de` / `willkommen123`.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (lokale Datenbank, Driver-Adapter `@prisma/adapter-better-sqlite3`)
- Auth.js (NextAuth) mit Credentials-Login
- @react-pdf/renderer für PDF-Angebote

## Struktur

- `src/app/(app)` – authentifizierter Bereich (Dashboard, Kunden, Projekte, Komponenten)
- `src/app/(app)/projekte/[id]/pv` – PV-Erfassungsassistent
- `src/app/(app)/projekte/[id]/waermepumpe` – Wärmepumpen-Erfassungsassistent
- `src/lib/calculations` – Berechnungslogik (PV-Dimensionierung, Heizlast/JAZ, Preisfindung)
- `prisma/schema.prisma` – Datenmodell

Alle Berechnungen sind vereinfachte Faustformeln für die Vertriebskalkulation, kein Ersatz für eine normkonforme Auslegung.
