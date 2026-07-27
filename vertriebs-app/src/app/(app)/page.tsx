import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Sun,
  Flame,
  Snowflake,
  Wrench,
  Zap,
  Droplet,
  Users as UsersIcon,
  ListChecks,
} from "lucide-react";
import { auth } from "@/auth";
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
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [customers, openTaskCount] = await Promise.all([
    prisma.customer.findMany({
      include: {
        projects: {
          include: { variants: { include: { status: true } } },
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.count({
      where: { assignedToId: session.user.id, status: "OFFEN" },
    }),
  ]);

  const taskWidget = (
    <LinkButton href="/aufgaben" variant="secondary">
      <ListChecks size={16} />
      {openTaskCount} offene Aufgabe{openTaskCount === 1 ? "" : "n"}
    </LinkButton>
  );

  if (customers.length === 0) {
    return (
      <div>
        <PageHeader
          title="Übersicht"
          description="Deine Vertriebs-Pipeline"
          action={taskWidget}
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
        action={
          <div className="flex flex-wrap items-center gap-2">
            {taskWidget}
            <LinkButton href="/kunden/neu">+ Neuer Kunde</LinkButton>
          </div>
        }
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
                        {customer.projects.flatMap((project) =>
                          project.variants.map((variant) => {
                            const Icon = VARIANT_ICONS[variant.variantType] ?? Sun;
                            return (
                              <span
                                key={variant.id}
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                title={`${labelFor(AUFTRAGSVARIANTEN, variant.variantType)}: ${variant.status.name}`}
                              >
                                <Icon size={12} />
                                {variant.status.name}
                              </span>
                            );
                          })
                        )}
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
