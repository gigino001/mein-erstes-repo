"use server";

import { prisma } from "@/lib/prisma";
import { performAppointmentCancellation } from "@/lib/appointments";
import { sendCustomerCancelledNotificationToOwner } from "@/lib/mail";

export type CancelByTokenResult =
  | { ok: true; depositAmountCents: number; depositRefunded: boolean }
  | { ok: false; reason: "not_found" | "already_cancelled" | "not_confirmed" | "past" };

export async function cancelAppointmentByToken(token: string): Promise<CancelByTokenResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { cancelToken: token },
    include: { service: true },
  });

  if (!appointment) return { ok: false, reason: "not_found" };
  if (appointment.status === "cancelled") return { ok: false, reason: "already_cancelled" };
  if (appointment.status !== "confirmed") return { ok: false, reason: "not_confirmed" };
  if (appointment.startAt.getTime() < Date.now()) return { ok: false, reason: "past" };

  const { depositRefunded } = await performAppointmentCancellation(appointment.id, true);

  await sendCustomerCancelledNotificationToOwner({
    id: appointment.id,
    customerName: appointment.customerName,
    customerEmail: appointment.customerEmail,
    serviceName: appointment.service.name,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    depositAmountCents: appointment.depositAmountCents,
    depositRefunded,
  });

  return { ok: true, depositAmountCents: appointment.depositAmountCents, depositRefunded };
}
