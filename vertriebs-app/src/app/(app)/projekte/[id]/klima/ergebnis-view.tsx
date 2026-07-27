import { Snowflake, Wind, Coins } from "lucide-react";
import { LinkButton } from "@/components/ui";
import { calculateKlima } from "@/lib/calculations/klima";
import type { ClimaData, KlimaRoom } from "@/generated/prisma/client";

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
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${accent ?? "bg-sky-50 text-sky-600 dark:bg-sky-950"}`}
      >
        <Icon size={18} />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export function ErgebnisView({
  climaData,
  projectId,
}: {
  climaData: ClimaData & { rooms: KlimaRoom[] };
  projectId: string;
}) {
  const rooms = climaData.rooms.filter((r) => r.areaSqm != null);

  if (rooms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
        <p className="font-medium">Noch keine Berechnung möglich</p>
        <p className="mt-1 text-sm text-slate-500">
          Erfasse zuerst mindestens einen Raum im Schritt &bdquo;Räume&ldquo;.
        </p>
      </div>
    );
  }

  const result = calculateKlima({
    insulationStandard: climaData.insulationStandard,
    rooms: rooms.map((r) => ({
      areaSqm: r.areaSqm!,
      shading: r.shading,
      occupantsCount: r.occupantsCount,
      hasHeatSources: r.hasHeatSources,
    })),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Snowflake}
          label="Kühllast gesamt"
          value={`${result.totalCoolingLoadKw} kW`}
        />
        <StatCard
          icon={Wind}
          label="Empfohlene Inneneinheiten"
          value={`${result.recommendedUnitsCount}`}
        />
        <StatCard
          icon={Coins}
          label="Betriebskosten / Jahr"
          value={`${result.estimatedAnnualOperatingCostEur.toLocaleString("de-DE")} €`}
          accent="bg-blue-50 text-blue-600 dark:bg-blue-950"
        />
      </div>

      <p className="text-xs text-slate-400">
        Vereinfachte Faustformel-Berechnung auf Basis der erfassten Raumdaten
        (kein Ersatz für eine normkonforme Kühllastberechnung nach VDI 2078).
      </p>

      <LinkButton href={`/projekte/${projectId}`}>
        Weiter zur Kostenkalkulation
      </LinkButton>
    </div>
  );
}
