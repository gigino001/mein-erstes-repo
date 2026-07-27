"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateKlima } from "@/lib/calculations/klima";
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

async function getClimaDataId(projectId: string) {
  const data = await prisma.climaData.findUnique({ where: { projectId } });
  if (!data) throw new Error("Klima-Daten nicht gefunden");
  return data.id;
}

export async function saveGebaeudeAction(projectId: string, formData: FormData) {
  await requireAuth();
  const id = await getClimaDataId(projectId);
  await prisma.climaData.update({
    where: { id },
    data: { insulationStandard: str(formData, "insulationStandard") },
  });
  redirect(`/projekte/${projectId}/klima/raeume`);
}

export async function saveRaeumeAction(projectId: string, formData: FormData) {
  await requireAuth();
  const climaDataId = await getClimaDataId(projectId);

  const rowCount = num(formData, "rowCount") ?? 0;
  const rooms = [];
  for (let i = 0; i < rowCount; i++) {
    const areaSqm = num(formData, `areaSqm-${i}`);
    const name = str(formData, `name-${i}`);
    if (!areaSqm && !name) continue;
    rooms.push({
      climaDataId,
      name: name ?? `Raum ${i + 1}`,
      areaSqm,
      ceilingHeightM: num(formData, `ceilingHeightM-${i}`),
      shading: str(formData, `shading-${i}`) ?? "MITTEL",
      occupantsCount: num(formData, `occupantsCount-${i}`),
      hasHeatSources: bool(formData, `hasHeatSources-${i}`),
      sortOrder: i,
    });
  }

  await prisma.$transaction([
    prisma.klimaRoom.deleteMany({ where: { climaDataId } }),
    ...(rooms.length > 0 ? [prisma.klimaRoom.createMany({ data: rooms })] : []),
  ]);

  redirect(`/projekte/${projectId}/klima/komponenten`);
}

export async function saveKomponentenAction(projectId: string, formData: FormData) {
  await requireAuth();
  const climaDataId = await getClimaDataId(projectId);

  await prisma.climaData.update({
    where: { id: climaDataId },
    data: {
      climaComponentId: str(formData, "climaComponentId"),
      unitsCount: num(formData, "unitsCount"),
    },
  });

  await recalculateKlima(projectId);
  redirect(`/projekte/${projectId}/klima/ergebnis`);
}

export async function recalculateKlima(projectId: string) {
  const data = await prisma.climaData.findUnique({
    where: { projectId },
    include: { rooms: { orderBy: { sortOrder: "asc" } }, climaComponent: true },
  });
  if (!data) return null;

  const lines: ComponentCostLine[] = [];
  if (data.climaComponent) {
    lines.push({
      componentId: data.climaComponent.id,
      description: `${data.climaComponent.manufacturer} ${data.climaComponent.name}`,
      unitPrice: data.climaComponent.price,
      quantity: data.unitsCount ?? 1,
    });
  }
  await syncComponentCostItems(projectId, "KLIMA", lines);

  const rooms = data.rooms.filter((r) => r.areaSqm != null);
  if (rooms.length === 0) return null;

  const result = calculateKlima({
    insulationStandard: data.insulationStandard,
    rooms: rooms.map((r) => ({
      areaSqm: r.areaSqm!,
      shading: r.shading,
      occupantsCount: r.occupantsCount,
      hasHeatSources: r.hasHeatSources,
    })),
  });

  await prisma.$transaction([
    ...rooms.map((r, i) =>
      prisma.klimaRoom.update({
        where: { id: r.id },
        data: { calculatedLoadKw: result.roomLoadsKw[i] },
      })
    ),
    prisma.climaData.update({
      where: { id: data.id },
      data: {
        calculatedTotalCoolingLoadKw: result.totalCoolingLoadKw,
        calculatedRecommendedUnitsCount: result.recommendedUnitsCount,
        calculatedEstimatedAnnualOperatingCost: result.estimatedAnnualOperatingCostEur,
      },
    }),
  ]);

  return result;
}
