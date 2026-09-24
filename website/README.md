# coco lashes — Website

Neue Homepage + eigenes Reservierungssystem für coco lashes (Bielefeld).
Der Gesamtplan (Markenrichtung, Farben/Typografie, Datenmodell, Bauphasen)
steht in [`../PROJECT_PLAN.md`](../PROJECT_PLAN.md).

## Setup

```bash
npm install
cp .env.example .env
npm run db:migrate   # legt die lokale SQLite-Datenbank an
npm run db:seed      # befüllt sie mit Claudia + den echten Leistungen/Preisen
npm run dev
```

Die Seite läuft dann unter http://localhost:3000.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS v4
- **Prisma** als ORM — lokal gegen SQLite, vor dem Deploy auf ALL-INKL wird
  der Provider in `prisma/schema.prisma` auf `mysql` umgestellt
- **Framer Motion** für die scroll-gekoppelten Effekte (Galerie-Filmstreifen,
  Einblenden beim Scrollen)

## Nützliche Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build (prüft auch Types) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Prisma-Migration anwenden |
| `npm run db:seed` | Datenbank mit Leistungen/Öffnungszeiten befüllen |
| `npm run db:studio` | Prisma Studio (Datenbank im Browser ansehen) |

## Stand

Fertig: Design-System (Farben/Typo), Startseite, Leistungen, Über mich,
Kontakt, FAQ (mit FAQPage-Schema), Impressum/Datenschutz (Entwürfe, siehe
Hinweise in den jeweiligen Dateien), SEO-Grundgerüst (Sitemap, robots.txt
inkl. KI-Crawler, LocalBusiness-Schema), sowie ein funktionierendes
Buchungssystem (Verfügbarkeits-Berechnung + Terminanfrage, ohne
Online-Zahlung).

Offen: echte Fotos, Admin-Oberfläche für Claudia (Termine bestätigen,
Zeiten blocken), Galerie-Inhalte, E-Mail-Benachrichtigung bei neuen
Terminanfragen, Deploy-Setup für ALL-INKL.
