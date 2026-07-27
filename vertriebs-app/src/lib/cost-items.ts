import { prisma } from "@/lib/prisma";
import { calculatePricing } from "@/lib/calculations/pricing";
import type { Component } from "@/generated/prisma/client";

export type ComponentCostLine = {
  componentId: string;
  description: string;
  unitPrice: number;
  quantity: number;
};

export const COST_ITEM_CATEGORIES = ["MATERIAL", "MONTAGE", "SONSTIGES"] as const;

const COST_CATEGORY_BY_COMPONENT_CATEGORY: Record<string, string> = {
  MODUL: "MATERIAL",
  WECHSELRICHTER: "MATERIAL",
  SPEICHER: "MATERIAL",
  WALLBOX: "MATERIAL",
  ENERGIEMANAGER: "MATERIAL",
  MONTAGESYSTEM: "MATERIAL",
  WAERMEPUMPE: "MATERIAL",
  PUFFERSPEICHER: "MATERIAL",
  KLIMAGERAET: "MATERIAL",
  MONTAGE: "MONTAGE",
  DIENSTLEISTUNG: "SONSTIGES",
  GARANTIE: "SONSTIGES",
  SONSTIGES: "SONSTIGES",
};

export function costCategoryForComponent(component: Pick<Component, "category">) {
  return COST_CATEGORY_BY_COMPONENT_CATEGORY[component.category] ?? "MATERIAL";
}

/**
 * Rechnet einen angefragten Rabatt serverseitig maßgeblich auf den an der
 * Komponente hinterlegten Rahmen herunter: Prozent-Limit (maxDiscountPercent)
 * und/oder Mindestpreis nach Rabatt je Einheit (maxDiscountAmount).
 */
export function clampDiscountPercent(
  component: Pick<Component, "price" | "maxDiscountPercent" | "maxDiscountAmount">,
  requestedPercent: number
): number {
  let percent = Number.isFinite(requestedPercent) ? requestedPercent : 0;
  percent = Math.min(100, Math.max(0, percent));

  if (component.maxDiscountPercent != null) {
    percent = Math.min(percent, component.maxDiscountPercent);
  }
  if (component.maxDiscountAmount != null && component.price > 0) {
    const maxPercentAllowedByFloor =
      ((component.price - component.maxDiscountAmount) / component.price) * 100;
    percent = Math.min(percent, Math.max(0, maxPercentAllowedByFloor));
  }
  return round(percent, 2);
}

export function computeCostItemAmount(
  unitPrice: number,
  quantity: number,
  discountPercent: number
) {
  return round(unitPrice * quantity * (1 - discountPercent / 100), 2);
}

/**
 * Ersetzt alle automatisch generierten Kostenpositionen einer Auftragsvariante
 * (identifiziert über sourceVariant) durch die aktuell im Erfassungsassistenten
 * ausgewählten Komponenten. Ein bereits gesetzter Rabatt für dieselbe
 * Komponente bleibt erhalten (erneut gegen die aktuellen Komponenten-Limits
 * geprüft). Manuell erfasste Positionen (sourceVariant = null) bleiben
 * unberührt.
 */
export async function syncComponentCostItems(
  projectId: string,
  sourceVariant: string,
  lines: ComponentCostLine[]
) {
  const [existing, components] = await Promise.all([
    prisma.costItem.findMany({ where: { projectId, sourceVariant } }),
    prisma.component.findMany({ where: { id: { in: lines.map((l) => l.componentId) } } }),
  ]);
  const discountByComponent = new Map(existing.map((i) => [i.componentId, i.discountPercent]));
  const componentById = new Map(components.map((c) => [c.id, c]));

  await prisma.$transaction([
    prisma.costItem.deleteMany({ where: { projectId, sourceVariant } }),
    ...(lines.length > 0
      ? [
          prisma.costItem.createMany({
            data: lines.map((line, i) => {
              const component = componentById.get(line.componentId);
              const unitPrice = component?.price ?? line.unitPrice;
              const requestedDiscount = discountByComponent.get(line.componentId) ?? 0;
              const discountPercent = component
                ? clampDiscountPercent(component, requestedDiscount)
                : 0;
              return {
                projectId,
                category: component ? costCategoryForComponent(component) : "MATERIAL",
                description: line.description,
                componentId: line.componentId,
                unitPrice,
                quantity: line.quantity,
                discountPercent,
                amount: computeCostItemAmount(unitPrice, line.quantity, discountPercent),
                sortOrder: i,
                sourceVariant,
              };
            }),
          }),
        ]
      : []),
  ]);

  await recalculatePricing(projectId);
}

// Umsatzsteuersatz für Kostenpositionen ohne Komponentenbezug (Freitext).
const DEFAULT_VAT_RATE_PERCENT = 19;

/** Nach Positionsbetrag gewichteter MwSt-Satz über alle Kostenpositionen. */
function weightedVatRatePercent(
  costItems: Array<{ amount: number; component: { vatRatePercent: number } | null }>
): number {
  const totalAmount = costItems.reduce((sum, item) => sum + item.amount, 0);
  if (totalAmount <= 0) return DEFAULT_VAT_RATE_PERCENT;

  const weightedSum = costItems.reduce(
    (sum, item) =>
      sum + item.amount * (item.component?.vatRatePercent ?? DEFAULT_VAT_RATE_PERCENT),
    0
  );
  return round(weightedSum / totalAmount, 2);
}

export async function recalculatePricing(projectId: string) {
  // Lesen + Schreiben in einer Transaktion, damit ein gleichzeitiger zweiter
  // Aufruf (z.B. paralleles Ändern von Kostenpositionen und Marge) nicht mit
  // veralteten Zwischenwerten überschreibt.
  await prisma.$transaction(async (tx) => {
    const [costItems, pricing] = await Promise.all([
      tx.costItem.findMany({ where: { projectId }, include: { component: true } }),
      tx.pricing.findUnique({ where: { projectId } }),
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

    const vatRatePercent = weightedVatRatePercent(costItems);
    const salesPriceGross = round(result.salesPrice * (1 + vatRatePercent / 100), 2);

    await tx.pricing.update({
      where: { projectId },
      data: {
        totalCost: result.totalCost,
        salesPrice: result.salesPrice,
        monthlyRate: result.monthlyRate,
        vatRatePercent,
        salesPriceGross,
      },
    });
  });
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
