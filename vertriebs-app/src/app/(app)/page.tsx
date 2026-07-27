import Link from "next/link";
import { Sun, Flame, Snowflake, Wrench, Zap, Droplet, Users as UsersIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, EmptyState, PipelineStatusBadge, Card } from "@/components/ui";
import { PIPELINE_STATUS, labelFor, AUFTRAGSVARIANTEN } from "@/lib/options";

const VARIANT_ICONS: Record<string, typeof Sun> = {
  PV: Sun,
  WAERMEPUMPE: Flame,
  KLIMA: Snowflake,
  WARTUNG: Wrench,
  ELEKTROINSTALLATION: Zap,
  HEIZUNG_SANITAER_NEUBAU: Droplet,
};

export default async function DashboardPage() {
  const customers = await prisma.customer.findMany({
    include: {
      projects: { include: { status: true }, orderBy: { updatedAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (customers.length === 0) {
    return (
      <div>
        <PageHeader
          title="Übersicht"
          description="Deine Vertriebs-Pipeline"
        />
        <div className="p-4 sm:p-8">
          <EmptyState
            title="Noch keine Kunden angelegt"
            description="Lege deinen ersten Kunden an, um eine Anfrage zu erfassen."
            action={
              <LinkButton href="/kunden/neu">Ersten Kunden anlegen</LinkButton>
            }
          />
        </div>
      </div>
    );
  }

  const grouped = PIPELINE_STATUS.map((status) => ({
    ...status,
    customers: customers.filter((c) => c.pipelineStatus === status.value),
  }));

  return (
    <div>
      <PageHeader
        title="Übersicht"
        description="Deine Vertriebs-Pipeline"
        action={<LinkButton href="/kunden/neu">+ Neuer Kunde</LinkButton>}
      />

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto p-4 sm:p-8 md:grid md:grid-cols-5 md:overflow-visible">
        {grouped.map((col) => (
          <div
            key={col.value}
            className="w-[85vw] shrink-0 snap-start md:w-auto"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <PipelineStatusBadge status={col.value} label={col.label} />
              <span className="text-xs text-slate-500">
                {col.customers.length}
              </span>
            </div>
            <div className="space-y-3">
              {col.customers.length === 0 && (
                <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-6 text-center text-xs text-slate-400">
                  Keine Kunden
                </p>
              )}
              {col.customers.map((customer) => (
                <Link key={customer.id} href={`/kunden/${customer.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <p className="font-medium">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {[customer.street, customer.city]
                        .filter(Boolean)
                        .join(", ") || "Keine Adresse hinterlegt"}
                    </p>
                    {customer.projects.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {customer.projects.map((project) => {
                          const Icon = VARIANT_ICONS[project.variantType] ?? Sun;
                          return (
                            <span
                              key={project.id}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              title={`${labelFor(AUFTRAGSVARIANTEN, project.variantType)}: ${project.status.name}`}
                            >
                              <Icon size={12} />
                              {project.status.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-8 sm:px-8">
        <Link
          href="/kunden"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600"
        >
          <UsersIcon size={14} />
          Alle {customers.length} Kunden ansehen
        </Link>
      </div>
    </div>
  );
}
