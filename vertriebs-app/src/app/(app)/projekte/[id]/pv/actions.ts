"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculatePv } from "@/lib/calculations/pv";
import { syncComponentCostItems, type ComponentCostLine } from "@/lib/cost-items";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
}

function num(formData: FormData, key: string): number | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

async function getPvDataId(projectId: string) {
  const pvData = await prisma.pvData.findUnique({ where: { projectId } });
  if (!pvData) throw new Error("PV-Daten nicht gefunden");
  return pvData.id;
}

export async function saveDachAction(projectId: string, formData: FormData) {
  await requireAuth();
  const pvDataId = await getPvDataId(projectId);

  await prisma.pvData.update({
    where: { id: pvDataId },
    data: { roofMaterial: str(formData, "roofMaterial") },
  });

  const rowCount = num(formData, "rowCount") ?? 0;
  const surfaces = [];
  for (let i = 0; i < rowCount; i++) {
    const orientation = str(formData, `orientation-${i}`);
    const areaSqm = num(formData, `areaSqm-${i}`);
    if (!orientation && !areaSqm) continue;
    surfaces.push({
      pvDataId,
      name: str(formData, `name-${i}`) ?? `Dachfläche ${i + 1}`,
      roofShape: str(formData, `roofShape-${i}`),
      orientation,
      tiltDegrees: num(formData, `tiltDegrees-${i}`),
      areaSqm,
      usableAreaSqm: num(formData, `usableAreaSqm-${i}`) ?? areaSqm,
      shading: str(formData, `shading-${i}`) ?? "KEINE",
      sortOrder: i,
    });
  }

  await prisma.$transaction([
    prisma.roofSurface.deleteMany({ where: { pvDataId } }),
    ...(surfaces.length > 0
      ? [prisma.roofSurface.createMany({ data: surfaces })]
      : []),
  ]);

  redirect(`/projekte/${projectId}/pv/verbrauch`);
}

export async function saveVerbrauchAction(projectId: string, formData: FormData) {
  await requireAuth();
  const pvDataId = await getPvDataId(projectId);
  await prisma.pvData.update({
    where: { id: pvDataId },
    data: {
      annualConsumptionKwh: num(formData, "annualConsumptionKwh"),
      personsCount: num(formData, "personsCount"),
      homeOffice: bool(formData, "homeOffice"),
      hasHeatPumpExisting: bool(formData, "hasHeatPumpExisting"),
      hasWallbox: bool(formData, "hasWallbox"),
      hasPool: bool(formData, "hasPool"),
      hasAirConditioning: bool(formData, "hasAirConditioning"),
    },
  });
  redirect(`/projekte/${projectId}/pv/netz-wunsch`);
}

export async function saveNetzWunschAction(projectId: string, formData: FormData) {
  await requireAuth();
  const pvDataId = await getPvDataId(projectId);
  await prisma.pvData.update({
    where: { id: pvDataId },
    data: {
      gridOperator: str(formData, "gridOperator"),
      meterCabinetSufficient: formData.has("meterCabinetSufficient")
        ? bool(formData, "meterCabinetSufficient")
        : null,
      threePhase: formData.has("threePhase") ? bool(formData, "threePhase") : null,
      gridConnectionPowerKw: num(formData, "gridConnectionPowerKw"),
      goalMaxSelfSupply: bool(formData, "goalMaxSelfSupply"),
      goalMaxYield: bool(formData, "goalMaxYield"),
      goalBackupPower: bool(formData, "goalBackupPower"),
      goalEmergencyPower: bool(formData, "goalEmergencyPower"),
      goalLowCost: bool(formData, "goalLowCost"),
    },
  });
  redirect(`/projekte/${projectId}/pv/komponenten`);
}

export async function saveKomponentenAction(projectId: string, formData: FormData) {
  await requireAuth();
  const pvDataId = await getPvDataId(projectId);

  const moduleComponentId = str(formData, "moduleComponentId");
  const moduleCount = num(formData, "moduleCount");
  const inverterComponentId = str(formData, "inverterComponentId");
  const storageComponentId = str(formData, "storageComponentId");
  const wallboxComponentId = str(formData, "wallboxComponentId");
  const emsComponentId = str(formData, "emsComponentId");
  const mountingSystemComponentId = str(formData, "mountingSystemComponentId");

  await prisma.pvData.update({
    where: { id: pvDataId },
    data: {
      moduleComponentId,
      moduleCount,
      inverterComponentId,
      storageComponentId,
      wallboxComponentId,
      emsComponentId,
      mountingSystemComponentId,
    },
  });

  await recalculatePv(projectId);
  redirect(`/projekte/${projectId}/pv/ergebnis`);
}

export async function recalculatePv(projectId: string) {
  const pvData = await prisma.pvData.findUnique({
    where: { projectId },
    include: {
      roofSurfaces: true,
      moduleComponent: true,
      inverterComponent: true,
      storageComponent: true,
      wallboxComponent: true,
      emsComponent: true,
      mountingSystemComponent: true,
    },
  });
  if (!pvData) return null;

  const lines: ComponentCostLine[] = [];
  if (pvData.moduleComponent && pvData.moduleCount) {
    lines.push({
      componentId: pvData.moduleComponent.id,
      description: `${pvData.moduleComponent.manufacturer} ${pvData.moduleComponent.name} (${pvData.moduleCount}x)`,
      unitPrice: pvData.moduleComponent.price,
      quantity: pvData.moduleCount,
    });
  }
  for (const component of [
    pvData.inverterComponent,
    pvData.storageComponent,
    pvData.wallboxComponent,
    pvData.emsComponent,
    pvData.mountingSystemComponent,
  ]) {
    if (component) {
      lines.push({
        componentId: component.id,
        description: `${component.manufacturer} ${component.name}`,
        unitPrice: component.price,
        quantity: 1,
      });
    }
  }
  await syncComponentCostItems(projectId, "PV", lines);

  if (!pvData.moduleComponent || !pvData.moduleCount) return null;

  const result = calculatePv({
    modulePowerWp: getWattPeak(pvData.moduleComponent.specs),
    moduleCount: pvData.moduleCount,
    roofSurfaces: pvData.roofSurfaces,
    annualConsumptionKwh: pvData.annualConsumptionKwh ?? 0,
    hasStorage: !!pvData.storageComponentId,
  });

  await prisma.pvData.update({
    where: { id: pvData.id },
    data: {
      calculatedKwp: result.kwp,
      calculatedAnnualYieldKwh: result.annualYieldKwh,
      calculatedSelfConsumptionKwh: result.selfConsumptionKwh,
      calculatedAutarkyPercent: result.autarkyPercent,
      calculatedFeedInKwh: result.feedInKwh,
      calculatedFeedInRevenue: result.feedInRevenueEur,
      calculatedSavingsPerYear: result.savingsPerYearEur,
      calculatedCo2SavingsKg: result.co2SavingsKgPerYear,
    },
  });

  return result;
}

function getWattPeak(specsJson: string): number {
  try {
    const specs = JSON.parse(specsJson);
    return Number(specs.wattPeak ?? specs.powerWp ?? 0);
  } catch {
    return 0;
  }
}
