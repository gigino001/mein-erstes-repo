import { Flame, Gauge, Coins, Leaf, TrendingDown } from "lucide-react";
import { LinkButton } from "@/components/ui";
import { calculateHeatPump } from "@/lib/calculations/heatpump";
import type { HeatPumpData, Component } from "@/generated/prisma/client";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${accent ?? "bg-orange-50 text-orange-600 dark:bg-orange-950"}`}
      >
        <Icon size={18} />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export function WpErgebnisView({
  data,
  projectId,
}: {
  data: HeatPumpData & { heatPumpComponent: Component | null };
  projectId: string;
}) {
  if (!data.heatedAreaSqm) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
        <p className="font-medium">Noch keine Berechnung möglich</p>
        <p className="mt-1 text-sm text-slate-500">
          Erfasse zuerst die beheizte Fläche im Schritt &bdquo;Gebäude&ldquo;.
        </p>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Flame} label="Heizlast" value={`${result.heatLoadKw} kW`} />
        <StatCard
          icon={Gauge}
          label="Jahresarbeitszahl (JAZ)"
          value={`${result.jaz}`}
        />
        <StatCard
          icon={Coins}
          label="Betriebskosten / Jahr"
          value={`${result.annualOperatingCostEur.toLocaleString("de-DE")} €`}
        />
        {result.savingsPerYearEur != null && (
          <StatCard
            icon={TrendingDown}
            label="Ersparnis / Jahr"
            value={`${result.savingsPerYearEur.toLocaleString("de-DE")} €`}
            accent="bg-blue-50 text-blue-600 dark:bg-blue-950"
          />
        )}
        {result.co2SavingsKgPerYear != null && (
          <StatCard
            icon={Leaf}
            label="CO₂-Einsparung / Jahr"
            value={`${result.co2SavingsKgPerYear.toLocaleString("de-DE")} kg`}
            accent="bg-lime-50 text-lime-700 dark:bg-lime-950"
          />
        )}
      </div>

      <p className="text-xs text-slate-400">
        Vereinfachte Faustformel-Berechnung (kein Ersatz für eine normkonforme
        Heizlastberechnung nach DIN EN 12831). Stromverbrauch der Wärmepumpe: ca.{" "}
        {result.annualElectricityConsumptionKwh.toLocaleString("de-DE")} kWh/Jahr.
      </p>

      <LinkButton href={`/projekte/${projectId}`}>
        Weiter zur Kostenkalkulation
      </LinkButton>
    </div>
  );
}
