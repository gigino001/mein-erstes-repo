# coco lashes — Website

Neue Homepage + eigenes Reservierungssystem für coco lashes (Bielefeld).
Der Gesamtplan (Markenrichtung, Farben/Typografie, Datenmodell, Bauphasen)
steht in [`../PROJECT_PLAN.md`](../PROJECT_PLAN.md).

## Setup

```bash
npm install
cp .env.example .env
docker compose up -d   # startet eine lokale MariaDB (siehe docker-compose.yml)
npm run db:migrate     # legt die Tabellen an
npm run db:seed        # befüllt sie mit Claudia + den echten Leistungen/Preisen
npm run admin:hash-password -- "DeinAdminPasswort"   # Ausgabe in .env als ADMIN_PASSWORD_HASH eintragen
npm run dev
```

Kein Docker zur Hand? Dann tut's auch eine lokal installierte MySQL/MariaDB —
einfach `DATABASE_URL` in der `.env` entsprechend anpassen.

Für `SESSION_SECRET` in der `.env` reicht ein beliebiger langer Zufallsstring
(z. B. `openssl rand -base64 32`).

Die Seite läuft dann unter http://localhost:3000, der Admin-Bereich unter
http://localhost:3000/admin.

**E-Mail-Versand:** Ohne `SMTP_*`-Werte in der `.env` werden Mails nur in
die Konsole geloggt (praktisch zum Testen). Für echten Versand die
SMTP-Zugangsdaten des E-Mail-Postfachs eintragen (bei ALL-INKL im KAS unter
"E-Mail-Konten" zu finden) — siehe Kommentare in `.env.example`.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS v4
- **Prisma** als ORM gegen **MySQL/MariaDB** (lokal via Docker Compose, auf
  ALL-INKL gegen die dort bereitgestellte MariaDB)
- **Framer Motion** für die scroll-gekoppelten Effekte (Galerie-Filmstreifen,
  Einblenden beim Scrollen)
- **Nodemailer** (SMTP) für Terminanfrage-/Bestätigungsmails, inkl.
  `.ics`-Kalenderanhang (Apple Kalender, Google Kalender, Outlook, …) bei
  bestätigten Terminen (Paket `ics`)

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
inkl. KI-Crawler, LocalBusiness-Schema), ein funktionierendes
Buchungssystem (Verfügbarkeits-Berechnung + Terminanfrage, ohne
Online-Zahlung), ein Admin-Bereich (`/admin`, passwortgeschützt): Anfragen
bestätigen/absagen, Zeiten für Urlaub o. Ä. blockieren, sowie
E-Mail-Benachrichtigungen bei jedem Schritt (neue Anfrage → Claudia +
Kundin, Bestätigung → Kundin mit `.ics`-Kalenderdatei, Absage → Kundin).
Läuft durchgehend gegen MySQL/MariaDB (lokal per Docker Compose).

Offen: echte Fotos, Galerie-Inhalte, Deploy-Setup für ALL-INKL.

## Netlify-Preview (Postgres statt MySQL)

Für eine Vorschau auf Netlify läuft die App aktuell gegen **Postgres** statt
MySQL/MariaDB — `prisma/schema.prisma` ist eine einzige, geteilte Datei, ein
Provider-Wechsel betrifft also auch die lokale Entwicklung (`docker-compose.yml`
startet entsprechend Postgres, nicht mehr MariaDB; `.env.example` ist
angepasst). Auf Netlify stellt Netlify DB die Datenbank beim Deploy
automatisch bereit (`@netlify/database`, Umgebungsvariable `NETLIFY_DB_URL`).
Schema und Grunddaten liegen dafür zusätzlich als reines SQL unter
`netlify/database/migrations/`, das Netlify vor jedem Build automatisch
anwendet (unabhängig von Prisma's eigenem Migrationssystem in
`prisma/migrations/`, das weiter für den lokalen Stack gilt).

Für die geplante ALL-INKL-Produktion (nur MySQL/MariaDB verfügbar) muss vor
dem echten Go-live entweder der Provider wieder auf `mysql` zurückgestellt
werden (inkl. neuer Migration) oder ALL-INKL gegen einen externen
Postgres-Host getauscht werden — das ist noch offen.

### Next.js-Version: 15.x statt 16.x

Das Projekt lief zwischenzeitlich auf Next.js 16.3.6, das zu diesem
Zeitpunkt noch nicht von Netlifys Next.js-Runtime-Plugin unterstützt wurde
(jeder Deploy mit explizitem `[[plugins]] package = "@netlify/plugin-nextjs"`
brach mit Exit-Code 2 ab, ohne das Plugin wurden gar keine Server-Functions
gebaut → jede URL 404). Deshalb wieder auf die aktuelle Next.js-15-Version
zurückgestellt (kompatibel mit dem Netlify-Runtime-Plugin). Dabei angepasst:
- `src/proxy.ts` → `src/middleware.ts` (Next 16 nannte die Datei/Funktion
  `proxy`, Next 15 nutzt noch `middleware`).
- `eslint.config.mjs` auf das in Next 15 übliche `FlatCompat`-Format
  umgestellt.
- `prisma.config.ts`: `earlyAccess` entfernt (nicht mehr im aktuellen
  Prisma-Config-Typ vorhanden).
- Ein `eslint-disable`-Kommentar in `BookingForm.tsx` entfernt, der eine
  Regel referenzierte, die in dieser Next/eslint-Kombination nicht
  existiert.

`netlify.toml` deklariert das Plugin jetzt wieder explizit.
