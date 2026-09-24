// Zentrale Business-Daten — an einer Stelle pflegen, überall wiederverwenden
// (Website-Texte, Metadata, Schema.org-Markup). Siehe PROJECT_PLAN.md.

export const business = {
  name: "coco lashes",
  legalName: "Claudia Gajda",
  owner: "Claudia Gajda",
  description:
    "Studio für individuelle Wimpernverlängerungen in Bielefeld. Jedes Set wird persönlich besprochen und angefertigt.",
  url: "https://cocolashes-bielefeld.de",
  phone: "+4917643456902",
  phoneDisplay: "+49 176 43456902",
  email: "cocolashes-bielefeld@gmx.de",
  instagram: "cocolashesbielefeld",
  instagramUrl: "https://www.instagram.com/cocolashesbielefeld",
  address: {
    street: "Gerichtstraße 13",
    postalCode: "33602",
    city: "Bielefeld",
    country: "DE",
  },
  openingHours: [
    { days: ["Mo", "Tu", "We", "Th"], label: "Montag – Donnerstag", opens: "10:00", closes: "20:00" },
    { days: ["Fr"], label: "Freitag", opens: "10:00", closes: "16:00" },
  ],
} as const;

export const fullAddress = `${business.address.street}, ${business.address.postalCode} ${business.address.city}`;
