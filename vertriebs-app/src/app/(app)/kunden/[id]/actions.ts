"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function createProjectAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const customerId = formData.get("customerId");
  const variantType = formData.get("variantType");
  if (typeof customerId !== "string" || typeof variantType !== "string") {
    throw new Error("customerId oder variantType fehlt");
  }
  const isNewBuilding = formData.get("isNewBuilding") === "on";

  const startStatus = await prisma.statusDefinition.findFirst({
    where: { variantType },
    orderBy: { sortOrder: "asc" },
  });
  if (!startStatus) {
    throw new Error(`Keine Status-Definition für ${variantType} gefunden`);
  }

  const project = await prisma.project.create({
    data: {
      customerId,
      ownerId: session.user.id,
      variantType,
      isNewBuilding,
      statusId: startStatus.id,
      pvData: variantType === "PV" ? { create: {} } : undefined,
      heatPumpData: variantType === "WAERMEPUMPE" ? { create: {} } : undefined,
      pricing: { create: {} },
    },
  });

  redirect(`/projekte/${project.id}`);
}

export async function updateFundingInfoAction(customerId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const usageType = formData.get("usageType");
  const incomeRaw = formData.get("annualHouseholdIncomeEur");
  const annualHouseholdIncomeEur =
    typeof incomeRaw === "string" && incomeRaw !== "" ? Number(incomeRaw) : null;

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      usageType: typeof usageType === "string" ? usageType : "SELBSTGENUTZT",
      annualHouseholdIncomeEur,
    },
  });
}

export async function updatePipelineStatusAction(customerId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const pipelineStatus = formData.get("pipelineStatus");
  if (typeof pipelineStatus !== "string") return;

  const followUpDateRaw = formData.get("followUpDate");
  const followUpDate =
    typeof followUpDateRaw === "string" && followUpDateRaw !== ""
      ? new Date(followUpDateRaw)
      : null;

  await prisma.customer.update({
    where: { id: customerId },
    data: { pipelineStatus, followUpDate },
  });
}
