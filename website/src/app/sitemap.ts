import type { MetadataRoute } from "next";
import { business } from "@/lib/business";

// Statt bei jedem Crawl "heute" zu melden (verfälscht Freshness-Signale),
// hier bei inhaltlichen Änderungen an den Kernseiten bewusst nachziehen.
const CONTENT_LAST_MODIFIED = new Date("2026-09-28");

const MAIN_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/leistungen", priority: 0.9, changeFrequency: "weekly" },
  { path: "/termin", priority: 0.9, changeFrequency: "monthly" },
  { path: "/ueber-mich", priority: 0.7, changeFrequency: "monthly" },
  { path: "/galerie", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/kontakt", priority: 0.6, changeFrequency: "monthly" },
];

const LEGAL_ROUTES = ["/impressum", "/datenschutz", "/agb"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...MAIN_ROUTES.map(({ path, priority, changeFrequency }) => ({
      url: `${business.url}${path}`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency,
      priority,
    })),
    ...LEGAL_ROUTES.map((path) => ({
      url: `${business.url}${path}`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
