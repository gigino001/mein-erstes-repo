"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createAdminSession, deleteAdminSession } from "@/lib/session";
import { verifyAdminSession } from "@/lib/dal";
import { sendAppointmentConfirmedToCustomer, sendAppointmentCancelledToCustomer } from "@/lib/mail";
import { getStripe } from "@/lib/stripe";

export type LoginResult = { ok: false; error: string } | never;

export async function login(_prevState: unknown, formData: FormData): Promise<LoginResult> {
  const password = String(formData.get("password") ?? "");
  const encodedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!encodedHash) {
    return { ok: false, error: "Admin-Login ist noch nicht eingerichtet (ADMIN_PASSWORD_HASH fehlt)." };
  }

  // Base64-dekodieren, siehe scripts/hash-password.ts (schützt den bcrypt-Hash
  // vor der "$"-Variablenexpansion von Next.js' .env-Loader).
  const hash = Buffer.from(encodedHash, "base64").toString("utf8");
  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return { ok: false, error: "Falsches Passwort." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logout() {
  await deleteAdminSession();
  redirect("/admin/login");
}

export async function confirmAppointment(id: string) {
  await verifyAdminSession();
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: "confirmed" },
    include: { service: true },
  });
  await sendAppointmentConfirmedToCustomer({
    id: appointment.id,
    customerName: appointment.customerName,
    customerEmail: appointment.customerEmail,
    serviceName: appointment.service.name,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
  });
}

/**
 * initiatedByCustomer steuert, ob die 24h-Regel aus den AGB greift:
 * - Sagt das Studio selbst ab (initiatedByCustomer = false), wird eine
 *   bezahlte Anzahlung immer zurückerstattet — die Kundin trifft keine Schuld.
 * - Storniert die Kundin (initiatedByCustomer = true), wird nur erstattet,
 *   wenn der Termin noch mindestens 24 Stunden entfernt ist; sonst verfällt
 *   die Anzahlung gemäß AGB § 3.
 */
export async function cancelAppointment(id: string, initiatedByCustomer: boolean = false) {
  await verifyAdminSession();
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

    // "best effort" — ein Refund-Fehler soll die Stornierung selbst nicht
    // blockieren, wird aber geloggt.
    if (shouldRefund) {
      const stripe = getStripe();
      if (stripe) {
        try {
          await stripe.refunds.create({ payment_intent: appointment.stripePaymentIntentId! });
          depositRefunded = true;
        } catch (err) {
          console.error("[admin] Rückerstattung der Anzahlung fehlgeschlagen:", err);
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
}

export async function createBlock(input: {
  staffId: string;
  date: string;
  allDay: boolean;
  startMinute?: number;
  endMinute?: number;
  reason?: string;
}) {
  await verifyAdminSession();
  await prisma.availabilityException.create({
    data: {
      staffId: input.staffId,
      date: new Date(`${input.date}T00:00:00`),
      allDay: input.allDay,
      startMinute: input.allDay ? null : input.startMinute,
      endMinute: input.allDay ? null : input.endMinute,
      reason: input.reason || null,
    },
  });
}

export async function deleteBlock(id: string) {
  await verifyAdminSession();
  await prisma.availabilityException.delete({ where: { id } });
}

export type ProductInput = {
  name: string;
  description?: string;
  priceCents: number;
  imageUrl?: string;
};

export async function createProduct(input: ProductInput) {
  await verifyAdminSession();
  await prisma.product.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      priceCents: input.priceCents,
      imageUrl: input.imageUrl?.trim() || null,
    },
  });
}

export async function updateProduct(id: string, input: ProductInput) {
  await verifyAdminSession();
  await prisma.product.update({
    where: { id },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      priceCents: input.priceCents,
      imageUrl: input.imageUrl?.trim() || null,
    },
  });
}

export async function toggleProductActive(id: string) {
  await verifyAdminSession();
  const product = await prisma.product.findUniqueOrThrow({ where: { id } });
  await prisma.product.update({ where: { id }, data: { active: !product.active } });
}

export async function updateShopSettings(input: { shippingEnabled: boolean; shippingCostCents: number }) {
  await verifyAdminSession();
  await prisma.shopSettings.upsert({
    where: { id: "singleton" },
    update: input,
    create: { id: "singleton", ...input },
  });
}

export async function markOrderCompleted(id: string) {
  await verifyAdminSession();
  await prisma.order.update({ where: { id }, data: { status: "completed" } });
}
