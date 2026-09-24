import type { MetadataRoute } from "next";
import { business } from "@/lib/business";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/ueber-mich", "/leistungen", "/galerie", "/faq", "/termin", "/kontakt"];
  return routes.map((route) => ({
    url: `${business.url}${route}`,
    lastModified: new Date(),
  }));
}
