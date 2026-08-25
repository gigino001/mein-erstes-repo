/*
  Lädt den Inhalt von dist/ per FTPS auf den Webspace.

  Einrichtung einmalig:
    1. .env.deploy.example nach .env.deploy kopieren
    2. Zugangsdaten aus dem ALL-INKL-KAS eintragen
    3. npm run deploy

  Die Datei .env.deploy enthält Zugangsdaten und steht in .gitignore.

  Warum ein Skript und nicht FileZilla: Versteckte Dateien wie .htaccess
  werden von FTP-Programmen standardmäßig nicht angezeigt und dadurch
  regelmäßig vergessen. Ohne sie greifen weder HTTPS-Zwang noch die
  eigene Fehlerseite noch der Schutz der Formular-Zugangsdaten. Dieses
  Skript lädt ausnahmslos alles.
*/

import { Client } from 'basic-ftp';
import { config } from 'dotenv';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: join(root, '.env.deploy') });

const {
  FTP_HOST,
  FTP_USER,
  FTP_PASSWORD,
  FTP_REMOTE_DIR = '/',
  FTP_SECURE = 'true',
} = process.env;

const fehlt = ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD'].filter((k) => !process.env[k]);
if (fehlt.length) {
  console.error(`\n  Zugangsdaten fehlen: ${fehlt.join(', ')}`);
  console.error('  Lege .env.deploy an (Vorlage: .env.deploy.example).\n');
  process.exit(1);
}

const dist = join(root, 'dist');
if (!existsSync(dist)) {
  console.error('\n  dist/ fehlt. Bitte zuerst `npm run build` ausführen.\n');
  process.exit(1);
}

/*
  Diese Datei enthält auf dem Server die Mail-Zugangsdaten und wird dort
  einmalig von Hand angelegt. Sie darf nie überschrieben werden.
*/
const NIEMALS_UEBERSCHREIBEN = new Set(['formular.config.php']);

const zaehle = (verzeichnis) =>
  readdirSync(verzeichnis).reduce((summe, eintrag) => {
    const pfad = join(verzeichnis, eintrag);
    return summe + (statSync(pfad).isDirectory() ? zaehle(pfad) : 1);
  }, 0);

const client = new Client(30_000);
client.ftp.verbose = false;

let hochgeladen = 0;
client.trackProgress((info) => {
  if (info.type === 'upload' && info.name) {
    hochgeladen += 1;
    process.stdout.write(`\r  ${String(hochgeladen).padStart(3)} Dateien …`);
  }
});

try {
  console.log(`\n  Verbinde mit ${FTP_HOST} …`);
  await client.access({
    host: FTP_HOST,
    user: FTP_USER,
    password: FTP_PASSWORD,
    secure: FTP_SECURE !== 'false',
    secureOptions: { rejectUnauthorized: false },
  });

  console.log(`  Zielverzeichnis: ${FTP_REMOTE_DIR}`);
  await client.ensureDir(FTP_REMOTE_DIR);

  // Serverseitige Konfiguration schützen
  for (const name of NIEMALS_UEBERSCHREIBEN) {
    if (existsSync(join(dist, name))) {
      console.warn(`  ACHTUNG: ${name} liegt in dist/ und würde die Serverfassung überschreiben.`);
      console.warn('  Bitte aus dist/ entfernen und erneut versuchen.');
      process.exit(1);
    }
  }

  const gesamt = zaehle(dist);
  console.log(`  Übertrage ${gesamt} Dateien (inklusive .htaccess) …`);

  await client.uploadFromDir(dist, FTP_REMOTE_DIR);

  process.stdout.write('\r');
  console.log(`  Fertig — ${gesamt} Dateien übertragen.\n`);
  console.log('  Jetzt prüfen:');
  console.log('    1. Seite im Browser aufrufen, mit Strg+F5 neu laden');
  console.log('    2. Eine erfundene Adresse aufrufen — es muss die eigene 404-Seite kommen');
  console.log('    3. Reservierungsformular abschicken und beide Mails prüfen\n');
} catch (fehler) {
  process.stdout.write('\r');
  console.error(`\n  Fehlgeschlagen: ${fehler.message}\n`);
  process.exitCode = 1;
} finally {
  client.close();
}
