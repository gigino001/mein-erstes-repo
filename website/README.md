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

Das Projekt lief zwischenzeitlich auf Next.js 16.3.6, deshalb wieder auf
die aktuelle Next.js-15-Version zurückgestellt (siehe Git-Historie für die
nötigen Anpassungen: `src/proxy.ts` → `src/middleware.ts`,
`eslint.config.mjs`, `prisma.config.ts`, ein veralteter `eslint-disable`-
Kommentar). Build, Lint und `next start` laufen sauber.

### Admin-Login auf Netlify

`ADMIN_PASSWORD_HASH` und `SESSION_SECRET` sind als Netlify-Umgebungsvariablen
gesetzt (nicht im Repo, siehe `.env.example` für lokale Entwicklung; wichtig:
`envVarIsSecret`/"Secret"-Markierung führte beim Setzen über die Netlify-API
zu einem stillen No-Op — die Variablen landeten nirgendwo, ohne Fehlermeldung.
Ohne diese Markierung wurden sie korrekt übernommen). Das
Admin-Passwort selbst steht nirgendwo im Code — nur der/die Website-Betreiber:in
kennt es. Nach dem Setzen/Ändern dieser Variablen ist ein neuer Deploy nötig,
damit die Netlify Function sie übernimmt (Umgebungsvariablen wirken erst ab
dem nächsten Build, nicht sofort auf bereits laufende Functions).

### Netlify-Deploy: gelöst

Nach einigem Herumraten (Next.js-Version, Turbopack/Webpack, Zip-Upload
vs. Git-Deploy — alles Sackgassen) war die eigentliche Ursache simpel: In
`netlify.toml` fehlte zeitweise der `command`, wodurch `next build` nie
lief und `.next` nie entstand — das `@netlify/plugin-nextjs`-Plugin brach
deshalb mit "publish directory was not found" ab (nur im Netlify-eigenen
Deploy-Log sichtbar, nicht über die verfügbaren Netlify-MCP-Tools). Davor
gab es zusätzlich einen Konflikt, weil `publish` implizit auf denselben
Pfad wie `base` zeigte (Altlast aus der ursprünglichen Einrichtung für
die alte statische PWA).

Die jetzige, funktionierende Konfiguration (Git-Verbindung zu GitHub,
nicht der Zip-Upload-Weg):

```toml
[build]
  base = "website"
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Prisma auf Netlify: Driver Adapter statt native Query-Engine

Erste Version nach dem Deploy-Fix: Seiten liefen, aber jede Anfrage, die
zur Laufzeit (nicht beim Build) auf die DB zugriff — allen voran
`/api/availability`, wodurch die Terminbuchung immer "keine Termine frei"
zeigte — lieferte einen leeren 500er. Ursache (gefunden über einen
temporären Debug-Passthrough in der Route, der den echten Fehler statt
eines leeren 500ers zurückgab): Prismas native Query-Engine wird beim
Netlify-Build für Debian gebaut, die tatsächliche Netlify-Function-Laufzeit
ist aber RHEL-basiert. Weder `binaryTargets = ["native", "rhel-openssl-3.0.x"]`
noch `outputFileTracingIncludes` noch ein manueller Copy-Schritt ins
Function-Bundle haben zuverlässig funktioniert (die RHEL-Engine landete
nie an einem der von Prisma zur Laufzeit abgesuchten Pfade).

Die robuste Lösung: `generator client` nutzt jetzt `engineType = "client"`
(Query Compiler statt nativer Engine) zusammen mit einem Driver Adapter
(`@prisma/adapter-pg`, direkt über den `pg`-Treiber) — dadurch wird gar
keine plattformspezifische Binary mehr gebraucht. `src/lib/prisma.ts` und
`prisma/seed.ts` erzeugen den `PrismaClient` entsprechend mit
`new PrismaPg({ connectionString })` statt über `datasources`.
