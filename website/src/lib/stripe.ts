import "server-only";
import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Liefert null statt zu werfen, wenn STRIPE_SECRET_KEY (noch) nicht gesetzt
 * ist — analog zu getTransport() in lib/mail.ts. So bricht weder der Build
 * noch die Buchung nicht-anzahlungspflichtiger Leistungen, solange der
 * Stripe-Schlüssel noch fehlt.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) cached = new Stripe(key);
  return cached;
}
