import { prisma } from "@/lib/prisma";
import { AUFTRAGSVARIANTEN, PIPELINE_STATUS } from "@/lib/options";

const MONTH_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  month: "short",
  year: "numeric",
});

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getRevenueByMonth() {
  const projects = await prisma.project.findMany({
    where: { variants: { every: { status: { isTerminal: true } } } },
    select: { createdAt: true, pricing: { select: { salesPrice: true } } },
  });

  const byMonth = new Map<string, { key: string; date: Date; revenueNet: number }>();
  for (const project of projects) {
    const key = monthKey(project.createdAt);
    const entry = byMonth.get(key) ?? { key, date: project.createdAt, revenueNet: 0 };
    entry.revenueNet += project.pricing?.salesPrice ?? 0;
    byMonth.set(key, entry);
  }

  return Array.from(byMonth.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((entry) => ({
      label: MONTH_FORMATTER.format(entry.date),
      revenueNet: entry.revenueNet,
    }));
}

export async function getAbschlussquote() {
  const grouped = await prisma.projectVariant.groupBy({
    by: ["variantType"],
    _count: { _all: true },
  });
  const wonGrouped = await prisma.projectVariant.groupBy({
    by: ["variantType"],
    where: { status: { isTerminal: true } },
    _count: { _all: true },
  });

  const wonByType = new Map(wonGrouped.map((g) => [g.variantType, g._count._all]));

  const perVariant = AUFTRAGSVARIANTEN.map((variant) => {
    const total = grouped.find((g) => g.variantType === variant.value)?._count._all ?? 0;
    const won = wonByType.get(variant.value) ?? 0;
    return { label: variant.label, total, won };
  }).filter((v) => v.total > 0);

  const total = perVariant.reduce((sum, v) => sum + v.total, 0);
  const won = perVariant.reduce((sum, v) => sum + v.won, 0);

  return { total, won, perVariant };
}

export async function getPipelineDistribution() {
  const grouped = await prisma.customer.groupBy({
    by: ["pipelineStatus"],
    _count: { _all: true },
  });
  const byStatus = new Map(grouped.map((g) => [g.pipelineStatus, g._count._all]));

  return PIPELINE_STATUS.map((status) => ({
    label: status.label,
    count: byStatus.get(status.value) ?? 0,
  }));
}

export async function getRevenueByOwner() {
  const projects = await prisma.project.findMany({
    where: { variants: { every: { status: { isTerminal: true } } } },
    select: {
      owner: { select: { id: true, name: true } },
      pricing: { select: { salesPrice: true } },
    },
  });

  const byOwner = new Map<string, { name: string; revenueNet: number; wonCount: number }>();
  for (const project of projects) {
    const entry = byOwner.get(project.owner.id) ?? {
      name: project.owner.name,
      revenueNet: 0,
      wonCount: 0,
    };
    entry.revenueNet += project.pricing?.salesPrice ?? 0;
    entry.wonCount += 1;
    byOwner.set(project.owner.id, entry);
  }

  return Array.from(byOwner.values()).sort((a, b) => b.revenueNet - a.revenueNet);
}
