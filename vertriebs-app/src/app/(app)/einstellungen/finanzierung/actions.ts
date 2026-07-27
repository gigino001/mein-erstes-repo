"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
}

export async function createFinancingRateAction(formData: FormData) {
  await requireAuth();
  const bankName = formData.get("bankName");
  const interestRatePercent = Number(formData.get("interestRatePercent"));
  if (
    typeof bankName !== "string" ||
    !bankName.trim() ||
    !Number.isFinite(interestRatePercent)
  ) {
    return;
  }

  await prisma.financingRate.create({
    data: { bankName: bankName.trim(), interestRatePercent },
  });
  revalidatePath("/einstellungen/finanzierung");
}

export async function updateFinancingRateAction(id: string, formData: FormData) {
  await requireAuth();
  const bankName = formData.get("bankName");
  const interestRatePercent = Number(formData.get("interestRatePercent"));
  if (
    typeof bankName !== "string" ||
    !bankName.trim() ||
    !Number.isFinite(interestRatePercent)
  ) {
    return;
  }

  await prisma.financingRate.update({
    where: { id },
    data: {
      bankName: bankName.trim(),
      interestRatePercent,
      active: formData.get("active") === "on",
    },
  });
  revalidatePath("/einstellungen/finanzierung");
}

export async function deleteFinancingRateAction(id: string) {
  await requireAuth();
  await prisma.financingRate.delete({ where: { id } });
  revalidatePath("/einstellungen/finanzierung");
}
