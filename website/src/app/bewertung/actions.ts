"use server";

import { createPendingReview } from "@/lib/reviews";
import type { ReviewResult } from "./[id]/actions";

export async function submitGeneralReview(
  customerName: string,
  rating: number,
  text: string,
  honeypot: string,
): Promise<ReviewResult> {
  // Unsichtbares Feld, das nur Bots ausfüllen — echte Besucherinnen sehen es
  // nie. Ersetzt die Termin-Prüfung des persönlichen Links, die es hier
  // bewusst nicht gibt (freier, überall teilbarer Link).
  if (honeypot.trim()) {
    return { ok: true };
  }

  if (!customerName.trim() || !text.trim()) {
    return { ok: false, error: "Bitte fülle deinen Namen und deine Bewertung aus." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Bitte wähle eine Sternebewertung von 1 bis 5." };
  }

  await createPendingReview({
    customerName: customerName.trim().slice(0, 200),
    rating,
    text: text.trim().slice(0, 4000),
  });

  return { ok: true };
}
