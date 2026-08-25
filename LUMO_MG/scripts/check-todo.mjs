/*
  Listet auf, was vor dem Livegang noch fehlt.

  Läuft über die Stammdaten und die Platzhalter-Schalter. Gibt Exit-Code 1
  zurück, wenn etwas Blockierendes offen ist — so lässt sich das später in
  einen Deploy-Schritt hängen, damit die Seite nicht versehentlich mit
  erfundenen Preisen online geht.

  Aufruf: npm run check:todo
*/

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const site = read('src/data/site.ts');
const menu = read('src/data/menu.ts');

const blocking = [];
const nonBlocking = [];

// TODO-Konstanten in den Stammdaten
const todoFields = [...site.matchAll(/^\s*(\w+):\s*TODO as string,/gm)].map((m) => m[1]);
const labels = {
  phone: 'Telefonnummer',
  email: 'Öffentliche E-Mail-Adresse',
  emailReservation: 'E-Mail für Reservierungen',
  company: 'Impressum: Firmierung',
  represented: 'Impressum: vertretungsberechtigte Person',
  register: 'Impressum: Handelsregister',
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

if (/export const menuIsPlaceholder = true/.test(menu)) {
  blocking.push('Speisekarte: Gerichte und Preise sind erfunden');
}
if (/export const hoursArePlaceholder = true/.test(site)) {
  blocking.push('Öffnungszeiten sind Platzhalter');
}

// Beispiel-Events
const eventsDir = 'src/content/events';
let placeholderEvents = 0;
try {
  const { readdirSync } = await import('node:fs');
  for (const file of readdirSync(join(root, eventsDir))) {
    if (file.endsWith('.md') && /^placeholder:\s*true/m.test(read(join(eventsDir, file)))) {
      placeholderEvents += 1;
    }
  }
} catch {
  /* Verzeichnis fehlt — dann gibt es auch keine Beispiele */
}
if (placeholderEvents > 0) {
  nonBlocking.push(`${placeholderEvents} Beispiel-Event(s) noch in src/content/events/`);
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
