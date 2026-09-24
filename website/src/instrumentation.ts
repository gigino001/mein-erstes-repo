export function register() {
  // Alle Termin-/Öffnungszeiten-Berechnungen (lib/availability.ts, lib/ics.ts)
  // gehen von der lokalen Server-Zeit als "Bielefeld-Zeit" aus. Ohne das hier
  // würde die Zeitzone vom Hosting-Server abhängen (z. B. UTC) und Termine
  // im Kalender/in der Buchung könnten mit falscher Uhrzeit erscheinen.
  process.env.TZ = "Europe/Berlin";
}
