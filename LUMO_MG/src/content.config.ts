import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// zod direkt statt ueber astro:content — der Re-Export dort ist abgekuendigt
import { z } from 'zod';

/*
  Events als Markdown-Dateien unter src/content/events/.
  Eine Datei = eine Veranstaltung = eine eigene, teilbare Seite.

  In Stufe 2 übernimmt der Admin-Bereich die Pflege; das Schema hier
  beschreibt schon die Felder, die die Datenbank später führen wird.
*/
const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    /** Titel der Veranstaltung */
    title: z.string(),
    /** Datum und Uhrzeit des Beginns */
    date: z.coerce.date(),
    /** Einlass, falls abweichend vom Beginn */
    doors: z.string().optional(),
    /** Ende, z. B. bei einem Brunch bis 16 Uhr */
    until: z.string().optional(),
    /** Kategorie für die Filterung in der Übersicht */
    category: z.enum(['Musik', 'Brunch', 'Bar', 'Special']).default('Special'),
    /** Ein bis zwei Sätze für Übersicht und Teilen-Vorschau */
    teaser: z.string().max(200),
    /** Externer Ticketverkauf, falls vorhanden */
    ticketUrl: z.url().optional(),
    /** Entwurf — erscheint nicht auf der Seite */
    draft: z.boolean().default(false),
    /**
     * Beispielinhalt für den Entwurf. Wird auf der Seite als solcher
     * gekennzeichnet und muss vor dem Livegang entfernt werden.
     */
    placeholder: z.boolean().default(false),
  }),
});

export const collections = { events };
