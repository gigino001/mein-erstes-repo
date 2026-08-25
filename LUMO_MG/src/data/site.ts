/*
  Zentrale Stammdaten der Seite.

  WICHTIG: Alles mit `TODO` ist Platzhalter und muss vor dem Livegang
  ersetzt werden. Der Build bricht deswegen nicht ab — aber `npm run
  check:todo` listet alle offenen Stellen auf.
*/

export const TODO = '__TODO__' as const;

export type Todo = typeof TODO;

/** Gesichert — aus dem Instagram-Auftritt @lumo.mg */
export const site = {
  name: 'LUMO',
  fullName: 'LUMO Mönchengladbach',
  tagline: ['Brunch', 'Café', 'Bar', 'Events'],
  claim: 'Warm tones. Natural textures. Good coffee.',
  description:
    'Modern Boho Brunch- und Dinner-Spot in Mönchengladbach. Türkisches Frühstück trifft moderne Brunch-Klassiker, dazu Speciality Coffee, Matcha, Signature Cocktails und Events.',
  url: 'https://lumo-mg.de',
  opening: '2026-09-03',
  address: {
    street: 'Krefelder Straße 221',
    postalCode: '41066',
    city: 'Mönchengladbach',
    country: 'DE',
  },
  parking: 'Eigene Parkplätze direkt vor dem Haus',
  instagram: {
    handle: '@lumo.mg',
    url: 'https://www.instagram.com/lumo.mg/',
  },
} as const;

/**
 * Eröffnungsdatum in den Schreibweisen, die auf der Seite vorkommen.
 * Wird überall daraus abgeleitet — das Datum steht nur einmal im Code.
 */
export const openingDate = new Date(site.opening + 'T00:00:00+02:00');

export const openingLong = openingDate.toLocaleDateString('de-DE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export const openingWithWeekday = openingDate.toLocaleDateString('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface Contact {
  phone: string;
  phoneE164: string;
  email: string;
  emailReservation: string;
}

export const contact: Contact = {
  /** Mobilnummer des Hauses */
  phone: '0160 91797206',
  /** Für tel:-Links und strukturierte Daten */
  phoneE164: '+4916091797206',
  email: 'info@lumo-mg.de',
  /**
   * TODO: eigene Adresse fuer Reservierungen anlegen. Bis dahin laufen
   * die Formulare ueber info@ — das funktioniert, vermischt aber
   * Reservierungen mit allem anderen im selben Postfach.
   */
  emailReservation: TODO,
};

/**
 * Öffnungszeiten des Hauses. `null` bedeutet Ruhetag.
 * Das Haus ist durchgehend geöffnet; die einzelnen Küchenzeiten stehen
 * weiter unten in `serviceTimes`.
 */
export const openingHours: ReadonlyArray<{
  day: string;
  short: string;
  from: string | null;
  to: string | null;
}> = [
  { day: 'Montag', short: 'Mo', from: null, to: null },
  { day: 'Dienstag', short: 'Di', from: '08:00', to: '22:00' },
  { day: 'Mittwoch', short: 'Mi', from: '08:00', to: '22:00' },
  { day: 'Donnerstag', short: 'Do', from: '08:00', to: '22:00' },
  { day: 'Freitag', short: 'Fr', from: '08:00', to: '23:00' },
  { day: 'Samstag', short: 'Sa', from: '09:30', to: '23:00' },
  { day: 'Sonntag', short: 'So', from: '09:30', to: '22:00' },
];

export const hoursArePlaceholder: boolean = false;

/**
 * Was wann serviert wird. Das ist der Teil, nach dem Gäste tatsächlich
 * suchen — „bis wann gibt es Frühstück" ist die häufigste Frage an ein
 * Brunch-Lokal.
 */
export const serviceTimes: ReadonlyArray<{
  title: string;
  note?: string;
  slots: ReadonlyArray<{ days: string; from: string; to: string }>;
}> = [
  {
    title: 'Brunch à la carte',
    slots: [
      { days: 'Dienstag – Freitag', from: '08:00', to: '13:00' },
      { days: 'Samstag & Sonntag', from: '09:30', to: '14:00' },
    ],
  },
  {
    title: 'Mittagsangebote',
    slots: [{ days: 'Dienstag – Freitag', from: '12:00', to: '14:00' }],
  },
  {
    title: 'Café & Bar',
    note: 'Nachmittags ohne warme Küche — Kaffee, Kuchen, Matcha und Drinks.',
    slots: [{ days: 'Dienstag – Sonntag', from: '14:00', to: '17:00' }],
  },
  {
    title: 'Dinner',
    slots: [
      { days: 'Dienstag – Donnerstag & Sonntag', from: '17:00', to: '22:00' },
      { days: 'Freitag & Samstag', from: '17:00', to: '23:00' },
    ],
  },
];

/** Das Haus schließt zwischen den Küchenzeiten nicht. */
export const openContinuously = true;

/** Der Tagesbogen aus dem Logo — Leitmotiv der Startseite */
export const dayArc = [
  { title: 'Brunch', note: 'ab 8 Uhr' },
  { title: 'Lunch', note: 'ab 12 Uhr' },
  { title: 'Coffee & Kuchen', note: 'nachmittags' },
  { title: 'Matcha', note: 'den ganzen Tag' },
  { title: 'Dinner', note: 'ab 17 Uhr' },
  { title: 'Signature Drinks', note: 'bis 23 Uhr' },
] as const;

export const nav = [
  { label: 'Das LUMO', href: '/#lumo' },
  { label: 'Karte', href: '/speisekarte' },
  { label: 'Events', href: '/events' },
  { label: 'Feiern', href: '/feiern' },
  { label: 'Finden', href: '/kontakt' },
] as const;

/** Kapazitäten für „Feiern & Mieten". TODO: echte Zahlen. */
export const venue: Record<'seatsIndoor' | 'seatsOutdoor' | 'partySeated' | 'partyStanding', string> = {
  seatsIndoor: TODO,
  seatsOutdoor: TODO,
  partySeated: TODO,
  partyStanding: TODO,
};

/**
 * Impressumsdaten.
 *
 * ACHTUNG: Eine GmbH MUSS nach §5 DDG Handelsregister und Registernummer
 * angeben. Ohne diese Angabe ist das Impressum unvollständig.
 */
interface Imprint {
  company: string;
  represented: string;
  register: string;
  vatId: string;
  responsible: string;
}

export const imprint: Imprint = {
  company: 'LUMO Gastro und Event GmbH',
  /** TODO: Schreibweise des Geschäftsführernamens bestätigen */
  represented: TODO,
  /** TODO: Amtsgericht und HRB-Nummer */
  register: TODO,
  /** TODO: USt-IdNr. */
  vatId: TODO,
  /** TODO: inhaltlich Verantwortliche(r) — meist der Geschäftsführer */
  responsible: TODO,
};
