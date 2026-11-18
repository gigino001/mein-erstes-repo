import { redirect } from "next/navigation";

// Shop ist noch nicht für echte Kundschaft bereit — Seite bewusst auf die
// Startseite umgeleitet, statt unverlinkt/unfertig online zu stehen (siehe
// SEO-Check). Admin-Verwaltung unter /admin/produkte bleibt unberührt.
export default function ShopPage() {
  redirect("/");
}
