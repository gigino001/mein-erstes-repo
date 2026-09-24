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
