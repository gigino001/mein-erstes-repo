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
  const variantTypes = formData
    .getAll("variantTypes")
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  if (typeof customerId !== "string" || variantTypes.length === 0) {
    throw new Error("customerId oder Auftragsvarianten fehlen");
  }
  const isNewBuilding = formData.get("isNewBuilding") === "on";

  const startStatuses = await Promise.all(
    variantTypes.map((variantType) =>
      prisma.statusDefinition.findFirst({
        where: { variantType },
        orderBy: { sortOrder: "asc" },
      })
    )
  );
  const missingIndex = startStatuses.findIndex((s) => !s);
  if (missingIndex !== -1) {
    throw new Error(`Keine Status-Definition für ${variantTypes[missingIndex]} gefunden`);
  }

  const project = await prisma.project.create({
    data: {
      customerId,
      ownerId: session.user.id,
      isNewBuilding,
      variants: {
        create: variantTypes.map((variantType, i) => ({
          variantType,
          statusId: startStatuses[i]!.id,
        })),
      },
      pvData: variantTypes.includes("PV") ? { create: {} } : undefined,
      heatPumpData: variantTypes.includes("WAERMEPUMPE") ? { create: {} } : undefined,
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
