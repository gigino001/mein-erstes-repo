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
    street: 'Krefelder Straße 219',
    postalCode: '41065',
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

/** Noch offen — vor dem Livegang zwingend zu füllen */
export const contact = {
  /** TODO: Telefonnummer des Hauses */
  phone: TODO as string,
  /** TODO: auf eigene Domain umstellen, sobald sie steht */
  email: TODO as string,
  emailReservation: TODO as string,
} as const;

/**
 * Öffnungszeiten.
 * TODO: durch die echten Zeiten ersetzen. `kitchen` ist der Küchenschluss,
 * `null` bedeutet Ruhetag.
 */
export const openingHours: ReadonlyArray<{
  day: string;
  short: string;
  from: string | null;
  to: string | null;
  kitchen: string | null;
}> = [
  { day: 'Montag', short: 'Mo', from: null, to: null, kitchen: null },
  { day: 'Dienstag', short: 'Di', from: '09:00', to: '23:00', kitchen: '21:30' },
  { day: 'Mittwoch', short: 'Mi', from: '09:00', to: '23:00', kitchen: '21:30' },
  { day: 'Donnerstag', short: 'Do', from: '09:00', to: '23:00', kitchen: '21:30' },
  { day: 'Freitag', short: 'Fr', from: '09:00', to: '01:00', kitchen: '22:30' },
  { day: 'Samstag', short: 'Sa', from: '09:00', to: '01:00', kitchen: '22:30' },
  { day: 'Sonntag', short: 'So', from: '09:00', to: '22:00', kitchen: '21:00' },
];

export const hoursArePlaceholder = true;

/** Der Tagesbogen aus dem Logo — Leitmotiv der Startseite */
export const dayArc = [
  { title: 'Brunch', note: 'ab 9 Uhr' },
  { title: 'Lunch', note: 'Mittagsangebote' },
  { title: 'Coffee & Kuchen', note: 'Speciality' },
  { title: 'Matcha', note: 'den ganzen Tag' },
  { title: 'Dinner', note: 'abends' },
  { title: 'Signature Drinks', note: 'late night' },
] as const;

export const nav = [
  { label: 'Das LUMO', href: '/#lumo' },
  { label: 'Karte', href: '/speisekarte' },
  { label: 'Events', href: '/events' },
  { label: 'Feiern', href: '/feiern' },
  { label: 'Finden', href: '/kontakt' },
] as const;

/** Kapazitäten für „Feiern & Mieten". TODO: echte Zahlen. */
export const venue = {
  seatsIndoor: TODO as string,
  seatsOutdoor: TODO as string,
  partySeated: TODO as string,
  partyStanding: TODO as string,
} as const;

/** Impressumsdaten. TODO: vollständig — ohne diese darf die Seite nicht live. */
export const imprint = {
  company: TODO as string,
  represented: TODO as string,
  register: TODO as string,
  vatId: TODO as string,
  responsible: TODO as string,
} as const;
