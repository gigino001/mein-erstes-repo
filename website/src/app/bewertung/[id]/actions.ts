"use server";

import { prisma } from "@/lib/prisma";
import { sendReviewToOwner } from "@/lib/mail";

export type ReviewResult = { ok: true } | { ok: false; error: string };

export async function submitReview(
  appointmentId: string,
  customerName: string,
  rating: number,
  text: string,
): Promise<ReviewResult> {
  if (!customerName.trim() || !text.trim()) {
    return { ok: false, error: "Bitte fülle deinen Namen und deine Bewertung aus." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Bitte wähle eine Sternebewertung von 1 bis 5." };
  }

  // Nur zu einem tatsächlich stattgefundenen, bestätigten Termin darf eine
  // Bewertung abgegeben werden — verhindert Spam über beliebige Links.
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment || appointment.status !== "confirmed" || appointment.startAt > new Date()) {
    return { ok: false, error: "Zu diesem Termin kann leider keine Bewertung abgegeben werden." };
  }

  await sendReviewToOwner({
    customerName: customerName.trim(),
    rating,
    text: text.trim(),
    appointmentId,
  });

  return { ok: true };
}
