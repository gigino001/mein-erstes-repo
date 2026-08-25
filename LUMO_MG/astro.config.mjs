import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Stufe 1: rein statischer Build. Läuft damit auf jedem Webspace.
// Für Stufe 2 wird hier auf output: 'server' plus Node-Adapter umgestellt.
export default defineConfig({
  site: 'https://lumo-mg.de',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // /speisekarte/index.html statt /speisekarte.html — funktioniert
    // ohne Server-Konfiguration auf jedem Hoster.
    format: 'directory',
  },
  compressHTML: true,

  integrations: [
    sitemap({
      // Danke-Seite und 404 gehoeren nicht in den Index
      filter: (page) => !page.includes('/danke') && !page.includes('/404'),
    }),
  ],

  // Astro lädt die Schriften beim Build herunter und liefert sie aus dem
  // eigenen Verzeichnis aus. Zur Laufzeit geht keine Verbindung zu Google —
  // das ist die Voraussetzung dafür, ohne Cookie-Banner auszukommen.
  fonts: [
    {
      name: 'Cormorant Garamond',
      cssVariable: '--font-display',
      provider: fontProviders.google(),
      weights: [300, 400, 500],
      styles: ['normal', 'italic'],
      // latin-ext wird für türkische Zeichen gebraucht (Çay, Simit, Börek).
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
    },
    {
      name: 'Jost',
      cssVariable: '--font-ui',
      provider: fontProviders.google(),
      weights: [300, 400, 500],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
    },
  ],
});
