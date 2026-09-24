import type { MetadataRoute } from "next";
import { business } from "@/lib/business";

// Klassische Suchmaschinen UND KI-Crawler bewusst zulassen (GEO/AEO, siehe
// PROJECT_PLAN.md, Abschnitt "SEO & KI-Auffindbarkeit") — sonst kann keine
// Chat-KI die Seite als Quelle zitieren/empfehlen.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${business.url}/sitemap.xml`,
  };
}
