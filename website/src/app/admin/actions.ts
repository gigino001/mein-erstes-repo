"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createAdminSession, deleteAdminSession } from "@/lib/session";
import { verifyAdminSession } from "@/lib/dal";

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
  await prisma.appointment.update({ where: { id }, data: { status: "confirmed" } });
}

export async function cancelAppointment(id: string) {
  await verifyAdminSession();
  await prisma.appointment.update({ where: { id }, data: { status: "cancelled" } });
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
