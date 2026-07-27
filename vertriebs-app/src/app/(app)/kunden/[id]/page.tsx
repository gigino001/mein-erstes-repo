import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Mail, MapPin, User, BadgeEuro } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, StatusBadge, EmptyState } from "@/components/ui";
import { labelFor, BUILDING_TYPES, AUFTRAGSVARIANTEN } from "@/lib/options";
import { Select, Field, TextInput, Checkbox } from "@/components/form";
import { Button } from "@/components/ui";
import { matchFundingPrograms } from "@/lib/funding-match";
import { createProjectAction, updatePipelineStatusAction, updateFundingInfoAction } from "./actions";
import { PipelineStatusForm } from "./pipeline-status-form";

const USAGE_TYPES = [
  { value: "SELBSTGENUTZT", label: "Selbstgenutzt" },
  { value: "VERMIETET", label: "Vermietet" },
] as const;

const FUNDING_TYPE_LABELS: Record<string, string> = {
  ZUSCHUSS: "Zuschuss",
  KREDIT: "Kredit",
  STEUERVORTEIL: "Steuervorteil",
};

export default async function KundeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [customer, fundingPrograms] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      include: {
        projects: {
          include: { variants: { include: { status: true } } },
          orderBy: { updatedAt: "desc" },
        },
      },
    }),
    prisma.fundingProgram.findMany({ where: { active: true } }),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        description={customer.company ?? undefined}
      />

      <div className="grid gap-6 p-4 sm:p-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-500">
              Kontakt
            </h2>
            <ul className="space-y-2.5 text-sm">
              {customer.street && (
                <li className="flex items-start gap-2.5">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>
                    {customer.street}
                    <br />
                    {[customer.postalCode, customer.city].filter(Boolean).join(" ")}
                  </span>
                </li>
              )}
              {customer.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone size={16} className="shrink-0 text-slate-400" />
                  <a href={`tel:${customer.phone}`} className="hover:text-emerald-600">
                    {customer.phone}
                  </a>
                </li>
              )}
              {customer.email && (
                <li className="flex items-center gap-2.5">
                  <Mail size={16} className="shrink-0 text-slate-400" />
                  <a href={`mailto:${customer.email}`} className="hover:text-emerald-600">
                    {customer.email}
                  </a>
                </li>
              )}
              {customer.contactPerson && (
                <li className="flex items-center gap-2.5">
                  <User size={16} className="shrink-0 text-slate-400" />
                  {customer.contactPerson}
                </li>
              )}
            </ul>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Gebäudetyp</dt>
                <dd>{labelFor(BUILDING_TYPES, customer.buildingType)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Baujahr</dt>
                <dd>{customer.buildYear ?? "–"}</dd>
              </div>
            </dl>
            {customer.notes && (
              <p className="mt-4 whitespace-pre-wrap border-t border-[var(--border)] pt-4 text-sm text-slate-500">
                {customer.notes}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-500">
              Status
            </h2>
            <PipelineStatusForm
              pipelineStatus={customer.pipelineStatus}
              followUpDate={customer.followUpDate}
              action={updatePipelineStatusAction.bind(null, customer.id)}
            />
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-500">
              Angaben für Förderprüfung
            </h2>
            <form
              action={updateFundingInfoAction.bind(null, customer.id)}
              className="space-y-3"
            >
              <Field label="Nutzung" htmlFor="usageType">
                <Select
                  id="usageType"
                  name="usageType"
                  defaultValue={customer.usageType}
                >
                  {USAGE_TYPES.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Zu versteuerndes Haushaltsjahreseinkommen (€)"
                htmlFor="annualHouseholdIncomeEur"
                hint="Nur für Einkommens-Bonus bei Wärmepumpe relevant"
              >
                <TextInput
                  id="annualHouseholdIncomeEur"
                  name="annualHouseholdIncomeEur"
                  type="number"
                  inputMode="numeric"
                  defaultValue={customer.annualHouseholdIncomeEur ?? ""}
                />
              </Field>
              <Button type="submit" variant="secondary" className="w-full">
                Speichern
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-500">
              Neuer Vorgang
            </h2>
            <form action={createProjectAction} className="space-y-3">
              <input type="hidden" name="customerId" value={customer.id} />
              <p className="text-xs text-slate-500">
                Leistungen auswählen (mehrere möglich)
              </p>
              <div className="space-y-2">
                {AUFTRAGSVARIANTEN.map((v) => (
                  <Checkbox
                    key={v.value}
                    name="variantTypes"
                    value={v.value}
                    label={v.label}
                  />
                ))}
              </div>
              <Checkbox name="isNewBuilding" label="Neubau (statt Bestandsgebäude)" />
              <Button type="submit" className="w-full">
                Vorgang anlegen
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-500">Vorgänge</h2>
            {customer.projects.length === 0 ? (
              <EmptyState
                title="Noch kein Vorgang"
                description="Lege links einen neuen Vorgang an, um mit der Datenerfassung zu starten."
              />
            ) : (
              customer.projects.map((project) => (
                <Link key={project.id} href={`/projekte/${project.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <div className="space-y-1.5">
                      {project.variants.map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between">
                          <p className="font-medium">
                            {labelFor(AUFTRAGSVARIANTEN, variant.variantType)}
                          </p>
                          <StatusBadge
                            name={variant.status.name}
                            sortOrder={variant.status.sortOrder}
                            isTerminal={variant.status.isTerminal}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Angelegt am{" "}
                      {new Intl.DateTimeFormat("de-DE").format(project.createdAt)}
                    </p>
                  </Card>
                </Link>
              ))
            )}
          </div>

          {customer.projects.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-500">
                Mögliche Förderungen
              </h2>
              {customer.projects.flatMap((project) =>
                project.variants.map((variant) => {
                  const matches = matchFundingPrograms(fundingPrograms, {
                    customer,
                    variantType: variant.variantType,
                    isNewBuilding: project.isNewBuilding,
                  });
                  if (matches.length === 0) return null;
                  return (
                    <Card key={variant.id}>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {labelFor(AUFTRAGSVARIANTEN, variant.variantType)}
                      </p>
                      <ul className="space-y-3">
                        {matches.map((program) => (
                          <li
                            key={program.id}
                            className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="flex items-center gap-1.5 text-sm font-medium">
                                <BadgeEuro size={14} className="text-emerald-600" />
                                {program.name}
                              </p>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                {FUNDING_TYPE_LABELS[program.fundingType] ?? program.fundingType}
                                {program.percentageOfCost != null && ` · ${program.percentageOfCost}%`}
                                {program.maxAmountEur != null &&
                                  ` · bis ${program.maxAmountEur.toLocaleString("de-DE")} €`}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{program.description}</p>
                            <p className="mt-1.5 text-xs text-slate-400">{program.conditions}</p>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs italic text-slate-400">
                        Automatische Vorprüfung, keine verbindliche Förderzusage und
                        keine Rechts-/Steuerberatung – bitte im Einzelfall prüfen.
                      </p>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
