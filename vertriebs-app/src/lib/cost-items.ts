import { prisma } from "@/lib/prisma";
import { calculatePricing } from "@/lib/calculations/pricing";

export type ComponentCostLine = {
  description: string;
  unitPrice: number;
  quantity: number;
};

/**
 * Ersetzt alle automatisch generierten Kostenpositionen einer Auftragsvariante
 * (identifiziert über sourceVariant) durch die aktuell im Erfassungsassistenten
 * ausgewählten Komponenten. Manuell erfasste Positionen (sourceVariant = null)
 * bleiben unberührt.
 */
export async function syncComponentCostItems(
  projectId: string,
  sourceVariant: string,
  lines: ComponentCostLine[]
) {
  await prisma.$transaction([
    prisma.costItem.deleteMany({ where: { projectId, sourceVariant } }),
    ...(lines.length > 0
      ? [
          prisma.costItem.createMany({
            data: lines.map((line, i) => ({
              projectId,
              category: "MATERIAL",
              description: line.description,
              amount: Math.round(line.unitPrice * line.quantity * 100) / 100,
              sortOrder: i,
              sourceVariant,
            })),
          }),
        ]
      : []),
  ]);

  await recalculatePricing(projectId);
}

export async function recalculatePricing(projectId: string) {
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
