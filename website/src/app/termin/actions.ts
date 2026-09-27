"use server";

import { prisma } from "@/lib/prisma";
import { getAvailableSlots, slotToRange } from "@/lib/availability";
import { sendNewRequestToOwner, sendRequestReceivedToCustomer } from "@/lib/mail";
import { getStripe } from "@/lib/stripe";
import { business } from "@/lib/business";

export type BookingInput = {
  serviceId: string;
  staffId: string;
  date: string;
  slot: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerInstagram?: string;
  note?: string;
  /** window.location.origin des Buchungsformulars, für Stripe-Redirect-URLs. */
  origin: string;
};

export type BookingResult =
  | { ok: true; type: "confirmed"; appointmentId: string }
  | { ok: true; type: "checkout"; checkoutUrl: string }
  | { ok: false; error: string };

// Kategorien, für die bei Buchung eine Anzahlung fällig wird, als Anteil des
// Leistungspreises. Aktuell nur Neumodellage — Auffülltermine/Sonstiges
// bleiben bewusst anzahlungsfrei.
const DEPOSIT_SHARE_BY_CATEGORY: Record<string, number> = {
  neumodellage: 0.5,
};

export async function requestAppointment(input: BookingInput): Promise<BookingResult> {
  const { serviceId, staffId, date, slot, customerName, customerEmail, customerPhone, customerInstagram, note, origin } =
    input;

  if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
    return { ok: false, error: "Bitte fülle Name, E-Mail und Telefonnummer aus." };
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return { ok: false, error: "Leistung nicht gefunden." };

  // Server-seitig erneut prüfen, ob der Slot noch frei ist (verhindert Doppelbuchungen
  // durch veraltete Client-Daten).
  const freshSlots = await getAvailableSlots({
    staffId,
    dateStr: date,
    durationMinutes: service.durationMinutes,
  });
  if (!freshSlots.includes(slot)) {
    return { ok: false, error: "Dieser Termin ist leider nicht mehr verfügbar. Bitte wähle einen anderen." };
  }

  const depositShare = DEPOSIT_SHARE_BY_CATEGORY[service.category];
  const depositAmountCents = depositShare ? Math.round(service.priceCents * depositShare) : 0;

  if (depositAmountCents > 0) {
    const stripe = getStripe();
    if (!stripe) {
      return {
        ok: false,
        error: "Online-Anzahlung ist aktuell nicht verfügbar. Bitte kontaktiere uns direkt, um den Termin zu vereinbaren.",
      };
    }

    // Der Termin wird erst per Webhook angelegt, sobald die Zahlung
    // tatsächlich bestätigt ist (siehe /api/stripe-webhook) — so entstehen
    // keine unbezahlten "requested"-Termine, die den Slot blockieren.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail.trim(),
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: depositAmountCents,
            product_data: {
              name: `Anzahlung: ${service.name}`,
              description: `${business.name} — Termin am ${date} um ${slot} Uhr`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/termin/anzahlung-erfolgreich`,
      cancel_url: `${origin}/termin?service=${serviceId}`,
      metadata: {
        serviceId,
        staffId,
        date,
        slot,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        customerInstagram: customerInstagram?.trim() || "",
        note: note?.trim() || "",
        depositAmountCents: String(depositAmountCents),
      },
    });

    if (!session.url) {
      return { ok: false, error: "Zahlung konnte nicht gestartet werden. Bitte versuche es erneut." };
    }
    return { ok: true, type: "checkout", checkoutUrl: session.url };
  }

  const { startAt, endAt } = slotToRange(date, slot, service.durationMinutes);

  const appointment = await prisma.appointment.create({
    data: {
      serviceId,
      staffId,
      startAt,
      endAt,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerInstagram: customerInstagram?.trim() || null,
      note: note?.trim() || null,
      status: "requested",
    },
  });

  const mailData = {
    id: appointment.id,
    customerName: appointment.customerName,
    customerEmail: appointment.customerEmail,
    customerInstagram: appointment.customerInstagram,
    serviceName: service.name,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
  };
  await Promise.all([sendNewRequestToOwner(mailData), sendRequestReceivedToCustomer(mailData)]);

  return { ok: true, type: "confirmed", appointmentId: appointment.id };
}
