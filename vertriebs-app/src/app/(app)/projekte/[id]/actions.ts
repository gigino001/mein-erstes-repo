"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  recalculatePricing,
  clampDiscountPercent,
  computeCostItemAmount,
  costCategoryForComponent,
  COST_ITEM_CATEGORIES,
} from "@/lib/cost-items";

export async function updateStatusAction(variantId: string, formData: FormData) {
  const statusId = formData.get("statusId");
  if (typeof statusId !== "string") return;

  const [variant, status] = await Promise.all([
    prisma.projectVariant.findUnique({ where: { id: variantId } }),
    prisma.statusDefinition.findUnique({ where: { id: statusId } }),
  ]);
  // Nur Status derselben Auftragsvariante zulassen (z.B. kein PV-Status auf
  // eine Klima-Variante).
  if (!variant || !status || status.variantType !== variant.variantType) return;

  await prisma.projectVariant.update({
    where: { id: variantId },
    data: { statusId },
  });
  revalidatePath(`/projekte/${variant.projectId}`);
  revalidatePath("/");
}

export async function addCostItemAction(projectId: string, formData: FormData) {
  const description = formData.get("description");
  if (typeof description !== "string" || !description.trim()) return;

  const componentId = formData.get("componentId");
  if (typeof componentId === "string" && componentId) {
    const component = await prisma.component.findUnique({ where: { id: componentId } });
    if (!component) return;

    const quantityRaw = Number(formData.get("quantity"));
    const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;
    const discountRaw = Number(formData.get("discountPercent"));
    const discountPercent = clampDiscountPercent(
      component,
      Number.isFinite(discountRaw) ? discountRaw : 0
    );

    await prisma.costItem.create({
      data: {
        projectId,
        category: costCategoryForComponent(component),
        description: description.trim(),
        componentId: component.id,
        unitPrice: component.price,
        quantity,
        discountPercent,
        amount: computeCostItemAmount(component.price, quantity, discountPercent),
      },
    });
  } else {
    const category = formData.get("category");
    const amount = Number(formData.get("amount"));
    if (
      typeof category !== "string" ||
      !COST_ITEM_CATEGORIES.includes(category as (typeof COST_ITEM_CATEGORIES)[number]) ||
      !Number.isFinite(amount)
    ) {
      return;
    }

    await prisma.costItem.create({
      data: { projectId, category, description: description.trim(), amount },
    });
  }

  await recalculatePricing(projectId);
  revalidatePath(`/projekte/${projectId}`);
}

export async function updateCostItemDiscountAction(
  projectId: string,
  costItemId: string,
  formData: FormData
) {
  const costItem = await prisma.costItem.findUnique({
    where: { id: costItemId },
    include: { component: true },
  });
  if (!costItem || costItem.projectId !== projectId || !costItem.component) return;

  const discountRaw = Number(formData.get("discountPercent"));
  const discountPercent = clampDiscountPercent(
    costItem.component,
    Number.isFinite(discountRaw) ? discountRaw : 0
  );
  const unitPrice = costItem.unitPrice ?? costItem.component.price;

  await prisma.costItem.update({
    where: { id: costItemId },
    data: {
      discountPercent,
      amount: computeCostItemAmount(unitPrice, costItem.quantity, discountPercent),
    },
  });

  await recalculatePricing(projectId);
  revalidatePath(`/projekte/${projectId}`);
}

export async function deleteCostItemAction(projectId: string, costItemId: string) {
  const costItem = await prisma.costItem.findUnique({ where: { id: costItemId } });
  if (!costItem || costItem.projectId !== projectId) return;

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
