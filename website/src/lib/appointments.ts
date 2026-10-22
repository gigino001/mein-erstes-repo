import "server-only";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { sendAppointmentCancelledToCustomer } from "@/lib/mail";

/**
 * Gemeinsame Stornierungslogik für den Admin-Bereich ("Absagen (Studio)" /
 * "Absagen (Kundin storniert)") und die öffentliche Selbststornierung
 * (/termin/stornieren/[token]). initiatedByCustomer steuert die 24h-Regel
 * aus den AGB: sagt das Studio selbst ab, wird eine Anzahlung immer
 * zurückerstattet; storniert die Kundin, nur wenn der Termin noch
 * mindestens 24 Stunden entfernt ist.
 */
export async function performAppointmentCancellation(id: string, initiatedByCustomer: boolean) {
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: "cancelled" },
    include: { service: true },
  });

  let depositRefunded = false;
  const hasDeposit = appointment.depositAmountCents > 0 && appointment.stripePaymentIntentId;

  if (hasDeposit) {
    const hoursUntilStart = (appointment.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
    const shouldRefund = !initiatedByCustomer || hoursUntilStart >= 24;

    if (shouldRefund) {
      const stripe = getStripe();
      if (stripe) {
        try {
          await stripe.refunds.create({ payment_intent: appointment.stripePaymentIntentId! });
          depositRefunded = true;
        } catch (err) {
          console.error("[appointments] Rückerstattung der Anzahlung fehlgeschlagen:", err);
        }
      }
    }
  }

  await sendAppointmentCancelledToCustomer({
    id: appointment.id,
    customerName: appointment.customerName,
    customerEmail: appointment.customerEmail,
    serviceName: appointment.service.name,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    depositAmountCents: appointment.depositAmountCents,
    depositRefunded,
  });

  return { appointment, depositRefunded };
}
