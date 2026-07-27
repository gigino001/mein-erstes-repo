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
      status: true,
      pvData: true,
      heatPumpData: true,
      costItems: { orderBy: { sortOrder: "asc" } },
      pricing: true,
    },
  });

  if (!project) {
    notFound();
  }

  const statuses = await prisma.statusDefinition.findMany({
    where: { variantType: project.variantType },
    orderBy: { sortOrder: "asc" },
  });

  const VariantIcon = VARIANT_ICONS[project.variantType] ?? Sun;
  const hasWizard = project.variantType === "PV" || project.variantType === "WAERMEPUMPE";

  return (
    <div>
      <PageHeader
        title={`${project.customer.firstName} ${project.customer.lastName}`}
        description={
          <span className="flex items-center gap-2">
            <Link href={`/kunden/${project.customer.id}`} className="hover:text-emerald-600">
              Zum Kundenprofil
            </Link>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="flex items-center gap-1">
              <VariantIcon size={13} />
              {labelFor(AUFTRAGSVARIANTEN, project.variantType)}
            </span>
          </span>
        }
        action={
          <StatusSelect
            projectId={project.id}
            statuses={statuses}
            currentStatusId={project.statusId}
            action={updateStatusAction.bind(null, project.id)}
          />
        }
      />

      <div className="grid gap-6 p-4 sm:p-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {project.variantType === "PV" && project.pvData && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Sun size={16} className="text-emerald-600" />
                  Photovoltaik
                </h2>
                <Link
                  href={`/projekte/${project.id}/pv/dach`}
                  className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                >
                  Bearbeiten <ArrowRight size={12} />
                </Link>
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
            </Card>
          )}

          {project.variantType === "WAERMEPUMPE" && project.heatPumpData && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Flame size={16} className="text-orange-600" />
                  Wärmepumpe
                </h2>
                <Link
                  href={`/projekte/${project.id}/waermepumpe/gebaeude`}
                  className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                >
                  Bearbeiten <ArrowRight size={12} />
                </Link>
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
            </Card>
          )}

          {!hasWizard && (
            <Card>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <VariantIcon size={16} className="text-emerald-600" />
                {labelFor(AUFTRAGSVARIANTEN, project.variantType)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Für diese Auftragsvariante gibt es noch keinen technischen
                Erfassungsassistenten. Kostenpositionen und Angebot unten
                erfassen.
              </p>
            </Card>
          )}

          {project.pricing && (
            <CostSection
              projectId={project.id}
              costItems={project.costItems}
              pricing={project.pricing}
            />
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-500">Angebot</h2>
            <p className="mb-4 text-sm text-slate-500">
              Erzeuge ein PDF-Angebot mit den erfassten Daten und dem berechneten
              Verkaufspreis.
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
