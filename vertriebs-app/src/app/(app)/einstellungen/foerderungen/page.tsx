import Link from "next/link";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, EmptyState, Card } from "@/components/ui";
import { deleteFundingProgramAction } from "./actions";

const PROVIDER_LABELS: Record<string, string> = {
  KFW: "KfW",
  BAFA: "BAFA",
  BUND: "Bund",
  LAND: "Land",
  KOMMUNE: "Kommune",
  SONSTIGE: "Sonstige",
};

const APPLIES_TO_LABELS: Record<string, string> = {
  PV: "Photovoltaik",
  WAERMEPUMPE: "Wärmepumpe",
  BEIDE: "PV & Wärmepumpe",
};

export default async function FoerderungenPage() {
  const programs = await prisma.fundingProgram.findMany({
    orderBy: [{ appliesTo: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Förderprogramme"
        description="Stammdaten für die Förder-Vorprüfung im Kundenprofil. Bitte regelmäßig auf Aktualität prüfen."
        action={
          <LinkButton href="/einstellungen/foerderungen/neu">
            + Neues Programm
          </LinkButton>
        }
      />

      <div className="p-4 sm:p-8">
        {programs.length === 0 ? (
          <EmptyState
            title="Noch keine Förderprogramme hinterlegt"
            description="Lege Förderprogramme für PV und Wärmepumpe an, damit sie im Kundenprofil automatisch vorgeschlagen werden."
            action={
              <LinkButton href="/einstellungen/foerderungen/neu">
                Erstes Programm anlegen
              </LinkButton>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {programs.map((program) => (
              <Card key={program.id} className={!program.active ? "opacity-50" : undefined}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{program.name}</p>
                    <p className="text-xs text-slate-500">
                      {PROVIDER_LABELS[program.provider] ?? program.provider} ·{" "}
                      {APPLIES_TO_LABELS[program.appliesTo] ?? program.appliesTo}
                    </p>
                  </div>
                  {(program.percentageOfCost != null || program.maxAmountEur != null) && (
                    <p className="shrink-0 text-sm font-medium text-emerald-600">
                      {program.percentageOfCost != null && `${program.percentageOfCost}%`}
                      {program.percentageOfCost != null && program.maxAmountEur != null && " · "}
                      {program.maxAmountEur != null &&
                        `bis ${program.maxAmountEur.toLocaleString("de-DE")} €`}
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500">{program.description}</p>
                <p className="mt-2 text-[11px] text-slate-400">
                  Zuletzt geprüft:{" "}
                  {new Intl.DateTimeFormat("de-DE").format(program.lastCheckedAt)}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
                  <Link
                    href={`/einstellungen/foerderungen/${program.id}`}
                    className="text-xs font-medium text-slate-500 hover:text-emerald-600"
                  >
                    Bearbeiten
                  </Link>
                  <form action={deleteFundingProgramAction.bind(null, program.id)}>
                    <button
                      type="submit"
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Löschen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
