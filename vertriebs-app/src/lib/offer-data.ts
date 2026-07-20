import { prisma } from "@/lib/prisma";
import { calculatePv } from "@/lib/calculations/pv";
import { calculateHeatPump } from "@/lib/calculations/heatpump";
import type { OfferDocumentProps } from "@/lib/pdf/offer-document";

function parseSpecs(specsJson: string): Record<string, number> {
  try {
    return JSON.parse(specsJson);
  } catch {
    return {};
  }
}

export async function buildOfferData(
  projectId: string
): Promise<(OfferDocumentProps & { offerNumber: string }) | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      customer: true,
      pricing: true,
      pvData: {
        include: {
          roofSurfaces: true,
          moduleComponent: true,
          inverterComponent: true,
          storageComponent: true,
        },
      },
      heatPumpData: { include: { heatPumpComponent: true } },
    },
  });

  if (!project || !project.pricing) return null;

  let pv: OfferDocumentProps["pv"] = null;
  if (project.wantsPv && project.pvData?.moduleComponent && project.pvData.moduleCount) {
    const wattPeak = parseSpecs(project.pvData.moduleComponent.specs).wattPeak ?? 0;
    const result = calculatePv({
      modulePowerWp: wattPeak,
      moduleCount: project.pvData.moduleCount,
      roofSurfaces: project.pvData.roofSurfaces,
      annualConsumptionKwh: project.pvData.annualConsumptionKwh ?? 0,
      hasStorage: !!project.pvData.storageComponentId,
    });
    pv = {
      kwp: result.kwp,
      moduleCount: project.pvData.moduleCount,
      moduleLabel: `${project.pvData.moduleComponent.manufacturer} ${project.pvData.moduleComponent.name}`,
      inverterLabel: project.pvData.inverterComponent
        ? `${project.pvData.inverterComponent.manufacturer} ${project.pvData.inverterComponent.name}`
        : null,
      storageLabel: project.pvData.storageComponent
        ? `${project.pvData.storageComponent.manufacturer} ${project.pvData.storageComponent.name}`
        : null,
      annualYieldKwh: result.annualYieldKwh,
      selfConsumptionKwh: result.selfConsumptionKwh,
      autarkyPercent: result.autarkyPercent,
      savingsPerYearEur: result.savingsPerYearEur,
      co2SavingsKg: result.co2SavingsKgPerYear,
    };
  }

  let heatPump: OfferDocumentProps["heatPump"] = null;
  if (project.wantsHeatPump && project.heatPumpData?.heatedAreaSqm) {
    const hp = project.heatPumpData;
    let jazOverride: number | null = null;
    if (hp.heatPumpComponent) {
      const specs = parseSpecs(hp.heatPumpComponent.specs);
      jazOverride = specs.jaz ?? null;
    }
    const result = calculateHeatPump({
      heatedAreaSqm: hp.heatedAreaSqm ?? 0,
      insulationStandard: hp.insulationStandard,
      heatEmitterType: hp.heatEmitterType,
      jazOverride,
      currentHeatingType: hp.currentHeatingType,
      annualConsumptionValue: hp.annualConsumptionValue,
      annualConsumptionUnit: hp.annualConsumptionUnit,
    });
    heatPump = {
      deviceLabel: hp.heatPumpComponent
        ? `${hp.heatPumpComponent.manufacturer} ${hp.heatPumpComponent.name}`
        : null,
      heatLoadKw: result.heatLoadKw,
      jaz: result.jaz,
      annualOperatingCostEur: result.annualOperatingCostEur,
      savingsPerYearEur: result.savingsPerYearEur,
      co2SavingsKg: result.co2SavingsKgPerYear,
    };
  }

  const offerNumber = `AN-${new Date().getFullYear()}-${project.id.slice(-6).toUpperCase()}`;

  return {
    offerNumber,
    createdAt: new Date(),
    customer: {
      salutation: project.customer.salutation,
      firstName: project.customer.firstName,
      lastName: project.customer.lastName,
      company: project.customer.company,
      street: project.customer.street,
      postalCode: project.customer.postalCode,
      city: project.customer.city,
    },
    pv,
    heatPump,
    salesPriceNet: project.pricing.salesPrice ?? 0,
    monthlyRate: project.pricing.monthlyRate,
  };
}
