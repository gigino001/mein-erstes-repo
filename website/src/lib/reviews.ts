import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendReviewToOwner } from "@/lib/mail";

/**
 * Legt eine neue Bewertung als "pending" an und verschickt die
 * Benachrichtigungs-Mail mit Freischalten-/Ablehnen-Link. Der Token steht
 * nur in dieser Mail — ersetzt für diese eine Aktion einen Login.
 */
export async function createPendingReview(data: {
  customerName: string;
  rating: number;
  text: string;
  appointmentId?: string;
}) {
  const token = randomBytes(24).toString("hex");

  await prisma.review.create({
    data: {
      customerName: data.customerName,
      rating: data.rating,
      text: data.text,
      token,
      appointmentId: data.appointmentId,
    },
  });

  await sendReviewToOwner({ ...data, token });
}
