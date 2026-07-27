"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function num(formData: FormData, key: string): number | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function strOrNull(formData: FormData, key: string): string | null {
  const v = str(formData, key).trim();
  return v === "" ? null : v;
}

function buildSpecs(category: string, formData: FormData): Record<string, number> {
  const specs: Record<string, number> = {};
  switch (category) {
    case "MODUL": {
      const wattPeak = num(formData, "wattPeak");
      if (wattPeak !== undefined) specs.wattPeak = wattPeak;
      const efficiency = num(formData, "efficiencyPercent");
      if (efficiency !== undefined) specs.efficiencyPercent = efficiency;
      break;
    }
    case "WECHSELRICHTER": {
      const powerKw = num(formData, "powerKw");
      if (powerKw !== undefined) specs.powerKw = powerKw;
      const mppt = num(formData, "mpptCount");
      if (mppt !== undefined) specs.mpptCount = mppt;
      break;
    }
    case "SPEICHER": {
      const capacityKwh = num(formData, "capacityKwh");
      if (capacityKwh !== undefined) specs.capacityKwh = capacityKwh;
      break;
    }
    case "WALLBOX": {
      const chargingPowerKw = num(formData, "chargingPowerKw");
      if (chargingPowerKw !== undefined) specs.chargingPowerKw = chargingPowerKw;
      break;
    }
    case "WAERMEPUMPE": {
      const heatingPowerKw = num(formData, "heatingPowerKw");
      if (heatingPowerKw !== undefined) specs.heatingPowerKw = heatingPowerKw;
      const jaz = num(formData, "jaz");
      if (jaz !== undefined) specs.jaz = jaz;
      break;
    }
    case "PUFFERSPEICHER": {
      const volumeLiters = num(formData, "volumeLiters");
      if (volumeLiters !== undefined) specs.volumeLiters = volumeLiters;
      break;
    }
  }
  return specs;
}

export async function createComponentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const category = str(formData, "category");
  const specs = buildSpecs(category, formData);

  await prisma.component.create({
    data: {
      category,
      manufacturer: str(formData, "manufacturer"),
      name: str(formData, "name"),
      longDescription: strOrNull(formData, "longDescription"),
      price: num(formData, "price") ?? 0,
      unit: str(formData, "unit") || "Stück",
      productNumber: strOrNull(formData, "productNumber"),
      vatRatePercent: num(formData, "vatRatePercent") ?? 19,
      maxDiscountPercent: num(formData, "maxDiscountPercent") ?? null,
      maxDiscountAmount: num(formData, "maxDiscountAmount") ?? null,
      specs: JSON.stringify(specs),
    },
  });

  revalidatePath("/komponenten");
  redirect("/komponenten");
}

export async function updateComponentAction(componentId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const category = str(formData, "category");
  const specs = buildSpecs(category, formData);

  await prisma.component.update({
    where: { id: componentId },
    data: {
      category,
      manufacturer: str(formData, "manufacturer"),
      name: str(formData, "name"),
      longDescription: strOrNull(formData, "longDescription"),
      price: num(formData, "price") ?? 0,
      unit: str(formData, "unit") || "Stück",
      productNumber: strOrNull(formData, "productNumber"),
      vatRatePercent: num(formData, "vatRatePercent") ?? 19,
      maxDiscountPercent: num(formData, "maxDiscountPercent") ?? null,
      maxDiscountAmount: num(formData, "maxDiscountAmount") ?? null,
      specs: JSON.stringify(specs),
      active: formData.get("active") === "on",
    },
  });

  revalidatePath("/komponenten");
  redirect("/komponenten");
}

export async function deleteComponentAction(componentId: string) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  await prisma.component.delete({ where: { id: componentId } });
  revalidatePath("/komponenten");
}
