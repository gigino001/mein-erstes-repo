"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { calculatePricing } from "@/lib/calculations/pricing";

async function recalculatePricing(projectId: string) {
  const [costItems, pricing] = await Promise.all([
    prisma.costItem.findMany({ where: { projectId } }),
    prisma.pricing.findUnique({ where: { projectId } }),
  ]);
  if (!pricing) return;

  const totalCost = costItems.reduce((sum, item) => sum + item.amount, 0);
  const result = calculatePricing({
    totalCost,
    marginPercent: pricing.marginPercent,
    discountAmount: pricing.discountAmount,
    financingMonths: pricing.financingMonths,
    financingInterestPercent: pricing.financingInterestPercent,
  });

  await prisma.pricing.update({
    where: { projectId },
    data: {
      totalCost: result.totalCost,
      salesPrice: result.salesPrice,
      monthlyRate: result.monthlyRate,
    },
  });
}

export async function updateStatusAction(projectId: string, formData: FormData) {
  const status = formData.get("status");
  if (typeof status !== "string") return;
  await prisma.project.update({ where: { id: projectId }, data: { status } });
  revalidatePath(`/projekte/${projectId}`);
  revalidatePath("/");
}

export async function addCostItemAction(projectId: string, formData: FormData) {
  const category = formData.get("category");
  const description = formData.get("description");
  const amount = Number(formData.get("amount"));
  if (
    typeof category !== "string" ||
    typeof description !== "string" ||
    !description.trim() ||
    !Number.isFinite(amount)
  ) {
    return;
  }

  await prisma.costItem.create({
    data: { projectId, category, description: description.trim(), amount },
  });
  await recalculatePricing(projectId);
  revalidatePath(`/projekte/${projectId}`);
}

export async function deleteCostItemAction(projectId: string, costItemId: string) {
  await prisma.costItem.delete({ where: { id: costItemId } });
  await recalculatePricing(projectId);
  revalidatePath(`/projekte/${projectId}`);
}

export async function updatePricingAction(projectId: string, formData: FormData) {
  const marginPercent = Number(formData.get("marginPercent"));
  const discountAmount = Number(formData.get("discountAmount"));
  const financingMonthsRaw = formData.get("financingMonths");
  const financingInterestRaw = formData.get("financingInterestPercent");

  await prisma.pricing.update({
    where: { projectId },
    data: {
      marginPercent: Number.isFinite(marginPercent) ? marginPercent : 20,
      discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
      financingMonths:
        typeof financingMonthsRaw === "string" && financingMonthsRaw !== ""
          ? Number(financingMonthsRaw)
          : null,
      financingInterestPercent:
        typeof financingInterestRaw === "string" && financingInterestRaw !== ""
          ? Number(financingInterestRaw)
          : null,
    },
  });

  await recalculatePricing(projectId);
  revalidatePath(`/projekte/${projectId}`);
}
