/*
  Listet auf, was vor dem Livegang noch fehlt.

  Läuft über die Stammdaten und die Platzhalter-Schalter. Gibt Exit-Code 1
  zurück, wenn etwas Blockierendes offen ist — so lässt sich das später in
  einen Deploy-Schritt hängen, damit die Seite nicht versehentlich mit
  erfundenen Preisen oder unvollständigem Impressum online geht.

  Aufruf: npm run check:todo
*/

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const site = read('src/data/site.ts');
const menu = read('src/data/menu.ts');
const demo = read('src/data/demo.ts');

const blocking = [];
const nonBlocking = [];

// Erfasst beide Schreibweisen: `feld: TODO,` und `feld: TODO as string,`
const todoFields = [...site.matchAll(/^[ \t]*(\w+):[ \t]*TODO\b[^,\n]*,/gm)].map((m) => m[1]);

/*
  Sicherung gegen genau den Fehler, der hier schon einmal passiert ist:
  Als die Schreibweise in site.ts von `TODO as string` auf `TODO` wechselte,
  fand das alte Suchmuster nichts mehr — und das Skript meldete Entwarnung,
  obwohl sämtliche Impressumsangaben fehlten. Ein Prüfskript, das still
  versagt, ist schlimmer als keines. Deshalb lieber laut abbrechen.
*/
if (todoFields.length === 0 && /:[ \t]*TODO\b/.test(site)) {
  console.error('\n  FEHLER: In site.ts stehen TODO-Werte, die dieses Skript');
  console.error('  nicht erkennt. Bitte das Suchmuster hier anpassen.\n');
  process.exit(2);
}

const labels = {
  phone: 'Telefonnummer',
  email: 'Öffentliche E-Mail-Adresse',
  emailReservation: 'E-Mail für Reservierungen',
  company: 'Impressum: Firmierung',
  represented: 'Impressum: vertretungsberechtigte Person',
  register: 'Impressum: Handelsregister und Registernummer',
  vatId: 'Impressum: USt-IdNr.',
  responsible: 'Impressum: inhaltlich Verantwortliche',
  seatsIndoor: 'Sitzplätze innen',
  seatsOutdoor: 'Sitzplätze Terrasse',
  partySeated: 'Feier-Kapazität sitzend',
  partyStanding: 'Feier-Kapazität stehend',
};

const blockingFields = new Set([
  'phone',
  'email',
  'company',
  'represented',
  'register',
  'vatId',
  'responsible',
]);

for (const field of todoFields) {
  const label = labels[field] ?? field;
  (blockingFields.has(field) ? blocking : nonBlocking).push(label);
}

if (/export const menuIsPlaceholder(\s*:\s*boolean)?\s*=\s*true/.test(menu)) {
  blocking.push('Speisekarte: Gerichte und Preise sind erfunden');
}
if (/export const hoursArePlaceholder(\s*:\s*boolean)?\s*=\s*true/.test(site)) {
  blocking.push('Öffnungszeiten sind Platzhalter');
}
if (/export const demoImages(\s*:\s*boolean)?\s*=\s*true/.test(demo)) {
  nonBlocking.push('Alle Bilder sind KI-generierte Demobilder, keine Fotos des Hauses');
}

// Beispiel-Events
const eventsDir = 'src/content/events';
let placeholderEvents = 0;
try {
  for (const file of readdirSync(join(root, eventsDir))) {
    if (file.endsWith('.md') && /^placeholder:\s*true/m.test(read(join(eventsDir, file)))) {
      placeholderEvents += 1;
    }
  }
} catch {
  /* Verzeichnis fehlt — dann gibt es auch keine Beispiele */
}
if (placeholderEvents > 0) {
  nonBlocking.push(`${placeholderEvents} Beispiel-Event(s) noch in ${eventsDir}/`);
}

// Ausgabe
const line = '─'.repeat(58);
console.log(`\n${line}\n  LUMO — was vor dem Livegang noch fehlt\n${line}\n`);

if (blocking.length === 0 && nonBlocking.length === 0) {
  console.log('  Nichts offen. Die Seite kann live gehen.\n');
  process.exit(0);
}

if (blocking.length > 0) {
  console.log('  BLOCKIEREND — ohne das darf die Seite nicht online:\n');
  for (const item of blocking) console.log(`    ✗  ${item}`);
  console.log('');
}

if (nonBlocking.length > 0) {
  console.log('  Nachlieferbar:\n');
  for (const item of nonBlocking) console.log(`    ·  ${item}`);
  console.log('');
}

console.log(`${line}\n`);
process.exit(blocking.length > 0 ? 1 : 0);
