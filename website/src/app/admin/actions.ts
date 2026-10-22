"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createAdminSession, deleteAdminSession } from "@/lib/session";
import { verifyAdminSession } from "@/lib/dal";
import { sendAppointmentConfirmedToCustomer, sendMarketingMailToCustomer } from "@/lib/mail";
import { performAppointmentCancellation } from "@/lib/appointments";

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
    cancelToken: appointment.cancelToken,
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
  await performAppointmentCancellation(id, initiatedByCustomer);
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

/**
 * Freitext-Mail (z. B. Rabattaktion) an eine Auswahl von Kundinnen aus dem
 * Kontakte-Admin. Namen werden hier nochmal aus der DB nachgeschlagen statt
 * dem Client zu vertrauen; versendet wird sequentiell, damit ein einzelner
 * SMTP-Fehler nicht den ganzen Versand abbricht.
 */
export async function sendMarketingMail(input: { emails: string[]; subject: string; message: string }) {
  await verifyAdminSession();

  const emails = [...new Set(input.emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const subject = input.subject.trim();
  const message = input.message.trim();
  if (emails.length === 0 || !subject || !message) {
    return { sent: 0, failed: 0, total: 0 };
  }

  const appointments = await prisma.appointment.findMany({
    where: { customerEmail: { in: emails } },
    orderBy: { startAt: "desc" },
    select: { customerName: true, customerEmail: true },
  });
  const nameByEmail = new Map<string, string>();
  for (const a of appointments) {
    const key = a.customerEmail.trim().toLowerCase();
    if (!nameByEmail.has(key)) nameByEmail.set(key, a.customerName);
  }

  let sent = 0;
  let failed = 0;
  for (const email of emails) {
    const customerName = nameByEmail.get(email);
    if (!customerName) continue;
    const ok = await sendMarketingMailToCustomer({ customerName, customerEmail: email, subject, message });
    if (ok) sent++;
    else failed++;
  }

  return { sent, failed, total: emails.length };
}
