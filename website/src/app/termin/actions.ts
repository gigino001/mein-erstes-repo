"use server";

import { prisma } from "@/lib/prisma";
import { getAvailableSlots, slotToRange } from "@/lib/availability";
import { sendNewRequestToOwner, sendRequestReceivedToCustomer } from "@/lib/mail";

export type BookingInput = {
  serviceId: string;
  staffId: string;
  date: string;
  slot: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  note?: string;
};

export type BookingResult =
  | { ok: true; appointmentId: string }
  | { ok: false; error: string };

export async function requestAppointment(input: BookingInput): Promise<BookingResult> {
  const { serviceId, staffId, date, slot, customerName, customerEmail, customerPhone, note } = input;

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
      note: note?.trim() || null,
      status: "requested",
    },
  });

  const mailData = {
    id: appointment.id,
    customerName: appointment.customerName,
    customerEmail: appointment.customerEmail,
    serviceName: service.name,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
  };
  await Promise.all([sendNewRequestToOwner(mailData), sendRequestReceivedToCustomer(mailData)]);

  return { ok: true, appointmentId: appointment.id };
}
