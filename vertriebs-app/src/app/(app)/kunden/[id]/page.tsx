import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Mail, MapPin, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, StatusBadge, EmptyState } from "@/components/ui";
import { labelFor, BUILDING_TYPES, AUFTRAGSVARIANTEN } from "@/lib/options";
import { Select } from "@/components/form";
import { Button } from "@/components/ui";
import { createProjectAction, updatePipelineStatusAction } from "./actions";
import { PipelineStatusForm } from "./pipeline-status-form";

export default async function KundeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      projects: { include: { status: true }, orderBy: { updatedAt: "desc" } },
    },
  });

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
              Neuer Vorgang
            </h2>
            <form action={createProjectAction} className="space-y-3">
              <input type="hidden" name="customerId" value={customer.id} />
              <Select name="variantType" defaultValue="PV" required>
                {AUFTRAGSVARIANTEN.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </Select>
              <Button type="submit" className="w-full">
                Vorgang anlegen
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-3 lg:col-span-2">
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
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {labelFor(AUFTRAGSVARIANTEN, project.variantType)}
                    </p>
                    <StatusBadge
                      name={project.status.name}
                      sortOrder={project.status.sortOrder}
                      isTerminal={project.status.isTerminal}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Angelegt am{" "}
                    {new Intl.DateTimeFormat("de-DE").format(project.createdAt)}
                  </p>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
