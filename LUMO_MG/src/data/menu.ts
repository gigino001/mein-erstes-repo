/*
  Speise- und Getränkekarte.

  ACHTUNG: Sämtliche Gerichte und Preise sind erfunden und dienen nur
  dazu, Aufbau und Wirkung zu zeigen. `menuIsPlaceholder` blendet auf
  der Seite einen entsprechenden Hinweis ein und muss zusammen mit den
  echten Daten auf false gesetzt werden.

  In Stufe 2 wandert dieser Inhalt in die Datenbank und wird über den
  Admin-Bereich gepflegt. Die Struktur hier entspricht bereits den
  Tabellen menu_sections und menu_items.
*/

export const menuIsPlaceholder = true;

/** Kennzeichnung nach LMIV — erscheint als Kürzel hinter dem Gericht */
export type Tag = 'vegetarisch' | 'vegan' | 'scharf' | 'glutenfrei';

export interface MenuItem {
  name: string;
  description?: string;
  /** Preis in Euro. `null` = "auf Anfrage" */
  price: number | null;
  /** Zusatz wie "für zwei Personen" */
  note?: string;
  tags?: Tag[];
}

export interface MenuSection {
  id: string;
  title: string;
  intro?: string;
  items: MenuItem[];
}

export const menu: MenuSection[] = [
  {
    id: 'brunch',
    title: 'Brunch',
    intro: 'Täglich ab 9 Uhr. Türkisches Frühstück trifft moderne Klassiker.',
    items: [
      {
        name: 'Türkisches Frühstück',
        description:
          'Käse, Oliven, Menemen, Sucuk, Honig mit Kaymak, Simit und Çay ohne Ende.',
        price: 28,
        note: 'für zwei Personen',
      },
      {
        name: 'Eggs Benedict',
        description: 'Pochierte Eier, Sauerteig, Hollandaise, Avocado.',
        price: 14.5,
        tags: ['vegetarisch'],
      },
      {
        name: 'Pancake Stack',
        description: 'Beeren, Ahornsirup, geröstete Nüsse.',
        price: 12,
        tags: ['vegetarisch'],
      },
      {
        name: 'Menemen',
        description: 'Rührei mit Tomaten und grüner Paprika, dazu Fladenbrot.',
        price: 11.5,
        tags: ['vegetarisch'],
      },
    ],
  },
  {
    id: 'coffee',
    title: 'Coffee & Matcha',
    intro: 'Speciality Coffee und eine eigene Matcha-Welt — mehr als ein Trend.',
    items: [
      { name: 'Espresso', price: 2.8 },
      { name: 'Flat White', price: 4.2 },
      { name: 'Filterkaffee', description: 'Wechselnder Einzelursprung.', price: 4.5 },
      {
        name: 'Ceremonial Matcha Latte',
        description: 'Wahlweise mit Hafer-, Mandel- oder Vollmilch.',
        price: 5.8,
        tags: ['vegetarisch'],
      },
      { name: 'Iced Matcha', price: 5.5, tags: ['vegan'] },
    ],
  },
  {
    id: 'kuchen',
    title: 'Kuchen & Torten',
    intro: 'Hausgemacht, wechselnd — fragt gerne nach der Tagesauswahl.',
    items: [
      { name: 'Matcha Cake', price: 6.5, tags: ['vegetarisch'] },
      { name: 'Pistazien-Baklava', price: 5.5, tags: ['vegetarisch'] },
      { name: 'Käsekuchen', price: 5.5, tags: ['vegetarisch'] },
    ],
  },
  {
    id: 'dinner',
    title: 'Dinner',
    intro: 'Ab 17 Uhr.',
    items: [
      {
        name: 'Mezze-Platte',
        description: 'Sechs Sorten, warmes Fladenbrot.',
        price: 19,
        tags: ['vegetarisch'],
      },
      { name: 'Lammkotelett vom Grill', description: 'Ofengemüse, Joghurt.', price: 29 },
      {
        name: 'Ofengemüse & Bulgur',
        description: 'Granatapfel, Minze, Tahin.',
        price: 17.5,
        tags: ['vegan'],
      },
      { name: 'Adana Kebap', description: 'Scharf, mit Sumak-Zwiebeln.', price: 22, tags: ['scharf'] },
    ],
  },
  {
    id: 'drinks',
    title: 'Signature Drinks',
    intro: 'Von unserer Bar. Alle Cocktails auch alkoholfrei.',
    items: [
      {
        name: 'LUMO Sunrise',
        description: 'Das Hausgetränk — Zitrus, Granatapfel, Rosmarin.',
        price: 13.5,
      },
      { name: 'Bali Spritz', description: 'Lemongras, Ingwer, Prosecco.', price: 12 },
      { name: 'Matcha Tonic', description: 'Alkoholfrei.', price: 8.5, tags: ['vegan'] },
      { name: 'Çay', description: 'Türkischer Tee im Glas.', price: 2.5, tags: ['vegan'] },
    ],
  },
];

/** Auszug für die Startseite — je ein Signature-Gericht pro Welt */
export const menuHighlights = [
  { section: 'brunch', name: 'Türkisches Frühstück' },
  { section: 'coffee', name: 'Ceremonial Matcha Latte' },
  { section: 'dinner', name: 'Mezze-Platte' },
  { section: 'drinks', name: 'LUMO Sunrise' },
] as const;

export const formatPrice = (price: number | null): string =>
  price === null
    ? 'auf Anfrage'
    : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
