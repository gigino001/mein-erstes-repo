"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function num(formData: FormData, key: string): number | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function buildData(formData: FormData) {
  return {
    name: str(formData, "name").trim(),
    provider: str(formData, "provider"),
    appliesTo: str(formData, "appliesTo"),
    fundingType: str(formData, "fundingType"),
    description: str(formData, "description").trim(),
    percentageOfCost: num(formData, "percentageOfCost") ?? null,
    maxAmountEur: num(formData, "maxAmountEur") ?? null,
    requiresExistingBuilding: formData.get("requiresExistingBuilding") === "on",
    requiresOwnerOccupied: formData.get("requiresOwnerOccupied") === "on",
    maxHouseholdIncomeEur: num(formData, "maxHouseholdIncomeEur") ?? null,
    conditions: str(formData, "conditions").trim(),
    sourceUrl: str(formData, "sourceUrl").trim() || null,
    active: formData.get("active") === "on",
    lastCheckedAt: new Date(),
  };
}

function hasRequiredFields(data: ReturnType<typeof buildData>) {
  return Boolean(data.name && data.provider && data.appliesTo && data.fundingType);
}

export async function createFundingProgramAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const data = buildData(formData);
  if (!hasRequiredFields(data)) return;

  await prisma.fundingProgram.create({ data });
  redirect("/einstellungen/foerderungen");
}

export async function updateFundingProgramAction(programId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const data = buildData(formData);
  if (!hasRequiredFields(data)) return;

  await prisma.fundingProgram.update({
    where: { id: programId },
    data,
  });
  redirect("/einstellungen/foerderungen");
}

export async function deleteFundingProgramAction(programId: string) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  await prisma.fundingProgram.delete({ where: { id: programId } });
  revalidatePath("/einstellungen/foerderungen");
}
