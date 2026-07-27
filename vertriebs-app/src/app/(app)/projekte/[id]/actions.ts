"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recalculatePricing } from "@/lib/cost-items";

export async function updateStatusAction(variantId: string, formData: FormData) {
  const statusId = formData.get("statusId");
  if (typeof statusId !== "string") return;
  const variant = await prisma.projectVariant.update({
    where: { id: variantId },
    data: { statusId },
  });
  revalidatePath(`/projekte/${variant.projectId}`);
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
