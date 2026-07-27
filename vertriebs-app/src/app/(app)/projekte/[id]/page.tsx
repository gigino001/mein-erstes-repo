import Link from "next/link";
import { notFound } from "next/navigation";
import { Sun, Flame, ArrowRight, FileText, Snowflake, Wrench, Zap, Droplet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { labelFor, AUFTRAGSVARIANTEN } from "@/lib/options";
import { StatusSelect } from "./status-select";
import { CostSection } from "./cost-section";
import { updateStatusAction } from "./actions";

const VARIANT_ICONS: Record<string, typeof Sun> = {
  PV: Sun,
  WAERMEPUMPE: Flame,
  KLIMA: Snowflake,
  WARTUNG: Wrench,
  ELEKTROINSTALLATION: Zap,
  HEIZUNG_SANITAER_NEUBAU: Droplet,
};

export default async function ProjektDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      variants: { include: { status: true } },
      pvData: true,
      heatPumpData: true,
      climaData: true,
      costItems: { orderBy: { sortOrder: "asc" }, include: { component: true } },
      pricing: true,
    },
  });

  if (!project) {
    notFound();
  }

  const variantTypes = project.variants.map((v) => v.variantType);
  const [statusOptions, components] = await Promise.all([
    prisma.statusDefinition.findMany({
      where: { variantType: { in: variantTypes } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.component.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { manufacturer: "asc" }],
    }),
  ]);
  const statusesByVariantType = new Map<string, typeof statusOptions>();
  for (const status of statusOptions) {
    const list = statusesByVariantType.get(status.variantType) ?? [];
    list.push(status);
    statusesByVariantType.set(status.variantType, list);
  }

  const pvVariant = project.variants.find((v) => v.variantType === "PV");
  const heatPumpVariant = project.variants.find((v) => v.variantType === "WAERMEPUMPE");
  const climaVariant = project.variants.find((v) => v.variantType === "KLIMA");
  const genericVariants = project.variants.filter(
    (v) => v.variantType !== "PV" && v.variantType !== "WAERMEPUMPE" && v.variantType !== "KLIMA"
  );

  return (
    <div>
      <PageHeader
        title={`${project.customer.firstName} ${project.customer.lastName}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Link href={`/kunden/${project.customer.id}`} className="hover:text-emerald-600">
              Zum Kundenprofil
            </Link>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            {project.variants.map((variant) => {
              const Icon = VARIANT_ICONS[variant.variantType] ?? Sun;
              return (
                <span key={variant.id} className="flex items-center gap-1">
                  <Icon size={13} />
                  {labelFor(AUFTRAGSVARIANTEN, variant.variantType)}
                </span>
              );
            })}
          </span>
        }
      />

      <div className="grid gap-6 p-4 sm:p-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {pvVariant && project.pvData && (
            <Card>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Sun size={16} className="text-emerald-600" />
                  Photovoltaik
                </h2>
                <StatusSelect
                  variantId={pvVariant.id}
                  statuses={statusesByVariantType.get("PV") ?? []}
                  currentStatusId={pvVariant.statusId}
                  action={updateStatusAction.bind(null, pvVariant.id)}
                />
              </div>
              {project.pvData.calculatedKwp ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Leistung" value={`${project.pvData.calculatedKwp} kWp`} />
                  <Stat
                    label="Jahresertrag"
                    value={`${project.pvData.calculatedAnnualYieldKwh?.toLocaleString("de-DE")} kWh`}
                  />
                  <Stat
                    label="Autarkie"
                    value={`${project.pvData.calculatedAutarkyPercent} %`}
                  />
                  <Stat
                    label="Ersparnis/Jahr"
                    value={`${project.pvData.calculatedSavingsPerYear?.toLocaleString("de-DE")} €`}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Noch keine Daten erfasst.{" "}
                  <Link href={`/projekte/${project.id}/pv/dach`} className="text-emerald-600 hover:underline">
                    Jetzt starten
                  </Link>
                </p>
              )}
              {project.pvData.calculatedKwp && (
                <div className="mt-3 border-t border-[var(--border)] pt-3 text-right">
                  <Link
                    href={`/projekte/${project.id}/pv/dach`}
                    className="flex items-center justify-end gap-1 text-xs font-medium text-emerald-600 hover:underline"
                  >
                    Bearbeiten <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </Card>
          )}

          {heatPumpVariant && project.heatPumpData && (
            <Card>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Flame size={16} className="text-orange-600" />
                  Wärmepumpe
                </h2>
                <StatusSelect
                  variantId={heatPumpVariant.id}
                  statuses={statusesByVariantType.get("WAERMEPUMPE") ?? []}
                  currentStatusId={heatPumpVariant.statusId}
                  action={updateStatusAction.bind(null, heatPumpVariant.id)}
                />
              </div>
              {project.heatPumpData.calculatedHeatLoadKw ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Heizlast" value={`${project.heatPumpData.calculatedHeatLoadKw} kW`} />
                  <Stat label="JAZ" value={`${project.heatPumpData.calculatedJaz}`} />
                  <Stat
                    label="Betriebskosten"
                    value={`${project.heatPumpData.calculatedAnnualOperatingCost?.toLocaleString("de-DE")} €`}
                  />
                  {project.heatPumpData.calculatedSavingsPerYear != null && (
                    <Stat
                      label="Ersparnis/Jahr"
                      value={`${project.heatPumpData.calculatedSavingsPerYear.toLocaleString("de-DE")} €`}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Noch keine Daten erfasst.{" "}
                  <Link
                    href={`/projekte/${project.id}/waermepumpe/gebaeude`}
                    className="text-emerald-600 hover:underline"
                  >
                    Jetzt starten
                  </Link>
                </p>
              )}
              {project.heatPumpData.calculatedHeatLoadKw && (
                <div className="mt-3 border-t border-[var(--border)] pt-3 text-right">
                  <Link
                    href={`/projekte/${project.id}/waermepumpe/gebaeude`}
                    className="flex items-center justify-end gap-1 text-xs font-medium text-emerald-600 hover:underline"
                  >
                    Bearbeiten <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </Card>
          )}

          {climaVariant && project.climaData && (
            <Card>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Snowflake size={16} className="text-sky-600" />
                  Klimaanlage
                </h2>
                <StatusSelect
                  variantId={climaVariant.id}
                  statuses={statusesByVariantType.get("KLIMA") ?? []}
                  currentStatusId={climaVariant.statusId}
                  action={updateStatusAction.bind(null, climaVariant.id)}
                />
              </div>
              {project.climaData.calculatedTotalCoolingLoadKw ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat
                    label="Kühllast gesamt"
                    value={`${project.climaData.calculatedTotalCoolingLoadKw} kW`}
                  />
                  <Stat
                    label="Inneneinheiten"
                    value={`${project.climaData.calculatedRecommendedUnitsCount}`}
                  />
                  <Stat
                    label="Betriebskosten/Jahr"
                    value={`${project.climaData.calculatedEstimatedAnnualOperatingCost?.toLocaleString("de-DE")} €`}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Noch keine Daten erfasst.{" "}
                  <Link
                    href={`/projekte/${project.id}/klima/gebaeude`}
                    className="text-emerald-600 hover:underline"
                  >
                    Jetzt starten
                  </Link>
                </p>
              )}
              {project.climaData.calculatedTotalCoolingLoadKw && (
                <div className="mt-3 border-t border-[var(--border)] pt-3 text-right">
                  <Link
                    href={`/projekte/${project.id}/klima/gebaeude`}
                    className="flex items-center justify-end gap-1 text-xs font-medium text-emerald-600 hover:underline"
                  >
                    Bearbeiten <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </Card>
          )}

          {genericVariants.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-slate-500">
                Weitere Leistungen
              </h2>
              <div className="space-y-3">
                {genericVariants.map((variant) => {
                  const VariantIcon = VARIANT_ICONS[variant.variantType] ?? Sun;
                  return (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3 first:border-t-0 first:pt-0"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <VariantIcon size={16} className="text-emerald-600" />
                        {labelFor(AUFTRAGSVARIANTEN, variant.variantType)}
                      </span>
                      <StatusSelect
                        variantId={variant.id}
                        statuses={statusesByVariantType.get(variant.variantType) ?? []}
                        currentStatusId={variant.statusId}
                        action={updateStatusAction.bind(null, variant.id)}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Für diese Leistungen gibt es noch keinen technischen
                Erfassungsassistenten. Kostenpositionen und Angebot unten
                erfassen.
              </p>
            </Card>
          )}

          {project.pricing && (
            <CostSection
              projectId={project.id}
              costItems={project.costItems}
              components={components}
              pricing={project.pricing}
            />
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-500">Angebot</h2>
            <p className="mb-4 text-sm text-slate-500">
              Erzeuge ein gemeinsames PDF-Angebot mit allen erfassten Leistungen
              und dem berechneten Verkaufspreis.
            </p>
            <LinkButton href={`/projekte/${project.id}/angebot`} className="w-full">
              <FileText size={16} />
              Angebot erstellen
            </LinkButton>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
