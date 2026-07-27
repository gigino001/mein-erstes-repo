"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateHeatPump } from "@/lib/calculations/heatpump";
import { UNIT_BY_HEATING_TYPE } from "./steps";

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

async function getHeatPumpDataId(projectId: string) {
  const data = await prisma.heatPumpData.findUnique({ where: { projectId } });
  if (!data) throw new Error("Wärmepumpen-Daten nicht gefunden");
  return data.id;
}

export async function saveGebaeudeAction(projectId: string, formData: FormData) {
  await requireAuth();
  const id = await getHeatPumpDataId(projectId);
  await prisma.heatPumpData.update({
    where: { id },
    data: {
      buildYear: num(formData, "buildYear"),
      livingAreaSqm: num(formData, "livingAreaSqm"),
      heatedAreaSqm: num(formData, "heatedAreaSqm"),
      insulationStandard: str(formData, "insulationStandard"),
      windowType: str(formData, "windowType"),
      floorsCount: num(formData, "floorsCount"),
    },
  });
  redirect(`/projekte/${projectId}/waermepumpe/heizung`);
}

export async function saveHeizungAction(projectId: string, formData: FormData) {
  await requireAuth();
  const id = await getHeatPumpDataId(projectId);
  const currentHeatingType = str(formData, "currentHeatingType");
  await prisma.heatPumpData.update({
    where: { id },
    data: {
      currentHeatingType,
      annualConsumptionValue: num(formData, "annualConsumptionValue"),
      annualConsumptionUnit: currentHeatingType
        ? UNIT_BY_HEATING_TYPE[currentHeatingType]
        : null,
    },
  });
  redirect(`/projekte/${projectId}/waermepumpe/heizkoerper`);
}

export async function saveHeizkoerperAction(projectId: string, formData: FormData) {
  await requireAuth();
  const id = await getHeatPumpDataId(projectId);
  await prisma.heatPumpData.update({
    where: { id },
    data: {
      heatEmitterType: str(formData, "heatEmitterType"),
      flowTemperature: num(formData, "flowTemperature"),
      personsCount: num(formData, "personsCount"),
      hotWaterStorageLiters: num(formData, "hotWaterStorageLiters"),
    },
  });
  redirect(`/projekte/${projectId}/waermepumpe/standort`);
}

export async function saveStandortAction(projectId: string, formData: FormData) {
  await requireAuth();
  const id = await getHeatPumpDataId(projectId);
  await prisma.heatPumpData.update({
    where: { id },
    data: {
      location: str(formData, "location"),
      designOutdoorTemp: num(formData, "designOutdoorTemp"),
    },
  });
  redirect(`/projekte/${projectId}/waermepumpe/komponenten`);
}

export async function saveKomponentenAction(projectId: string, formData: FormData) {
  await requireAuth();
  const id = await getHeatPumpDataId(projectId);
  await prisma.heatPumpData.update({
    where: { id },
    data: {
      heatPumpComponentId: str(formData, "heatPumpComponentId"),
      bufferComponentId: str(formData, "bufferComponentId"),
    },
  });
  await recalculateHeatPump(projectId);
  redirect(`/projekte/${projectId}/waermepumpe/ergebnis`);
}

export async function recalculateHeatPump(projectId: string) {
  const data = await prisma.heatPumpData.findUnique({
    where: { projectId },
    include: { heatPumpComponent: true },
  });
  if (!data || !data.heatedAreaSqm) return null;

  let jazOverride: number | null = null;
  if (data.heatPumpComponent) {
    try {
      const specs = JSON.parse(data.heatPumpComponent.specs);
      jazOverride = specs.jaz ? Number(specs.jaz) : null;
    } catch {
      jazOverride = null;
    }
  }

  const result = calculateHeatPump({
    heatedAreaSqm: data.heatedAreaSqm,
    insulationStandard: data.insulationStandard,
    heatEmitterType: data.heatEmitterType,
    jazOverride,
    currentHeatingType: data.currentHeatingType,
    annualConsumptionValue: data.annualConsumptionValue,
    annualConsumptionUnit: data.annualConsumptionUnit,
  });

  await prisma.heatPumpData.update({
    where: { id: data.id },
    data: {
      calculatedHeatLoadKw: result.heatLoadKw,
      calculatedAnnualConsumptionKwh: result.annualElectricityConsumptionKwh,
      calculatedJaz: result.jaz,
      calculatedAnnualOperatingCost: result.annualOperatingCostEur,
      calculatedOldAnnualCost: result.oldAnnualCostEur,
      calculatedSavingsPerYear: result.savingsPerYearEur,
      calculatedCo2SavingsKg: result.co2SavingsKgPerYear,
    },
  });

  return result;
}
