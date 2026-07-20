import { Sun, Battery, Home, Zap, Leaf, TrendingUp } from "lucide-react";
import { LinkButton } from "@/components/ui";
import { calculatePv } from "@/lib/calculations/pv";
import type { PvData, RoofSurface, Component } from "@/generated/prisma/client";

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
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${accent ?? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950"}`}
      >
        <Icon size={18} />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export function ErgebnisView({
  pvData,
  projectId,
}: {
  pvData: PvData & { roofSurfaces: RoofSurface[]; moduleComponent: Component | null };
  projectId: string;
}) {
  if (!pvData.moduleComponent || !pvData.moduleCount) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
        <p className="font-medium">Noch keine Berechnung möglich</p>
        <p className="mt-1 text-sm text-slate-500">
          Wähle im Schritt &bdquo;Komponenten&ldquo; ein Modul und die Modulanzahl aus.
        </p>
      </div>
    );
  }

  let wattPeak = 0;
  try {
    wattPeak = Number(JSON.parse(pvData.moduleComponent.specs).wattPeak ?? 0);
  } catch {
    wattPeak = 0;
  }

  const result = calculatePv({
    modulePowerWp: wattPeak,
    moduleCount: pvData.moduleCount,
    roofSurfaces: pvData.roofSurfaces,
    annualConsumptionKwh: pvData.annualConsumptionKwh ?? 0,
    hasStorage: !!pvData.storageComponentId,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Sun} label="Anlagenleistung" value={`${result.kwp} kWp`} />
        <StatCard
          icon={Zap}
          label="Jahresertrag"
          value={`${result.annualYieldKwh.toLocaleString("de-DE")} kWh`}
        />
        <StatCard
          icon={Home}
          label="Autarkiegrad"
          value={`${result.autarkyPercent} %`}
        />
        <StatCard
          icon={Battery}
          label="Eigenverbrauch"
          value={`${result.selfConsumptionKwh.toLocaleString("de-DE")} kWh`}
        />
        <StatCard
          icon={TrendingUp}
          label="Ersparnis / Jahr"
          value={`${result.savingsPerYearEur.toLocaleString("de-DE")} €`}
          accent="bg-blue-50 text-blue-600 dark:bg-blue-950"
        />
        <StatCard
          icon={Leaf}
          label="CO₂-Einsparung / Jahr"
          value={`${result.co2SavingsKgPerYear.toLocaleString("de-DE")} kg`}
          accent="bg-lime-50 text-lime-700 dark:bg-lime-950"
        />
      </div>

      <p className="text-xs text-slate-400">
        Vereinfachte Faustformel-Berechnung auf Basis der erfassten Dach- und
        Verbrauchsdaten. Einspeisung: {result.feedInKwh.toLocaleString("de-DE")} kWh
        (≈ {result.feedInRevenueEur.toLocaleString("de-DE")} € Vergütung/Jahr).
      </p>

      <LinkButton href={`/projekte/${projectId}`}>
        Weiter zur Kostenkalkulation
      </LinkButton>
    </div>
  );
}
