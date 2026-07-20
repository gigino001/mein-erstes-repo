import Link from "next/link";
import { Sun, Flame, Users as UsersIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, EmptyState, StatusBadge, Card } from "@/components/ui";

const COLUMNS = ["NEU", "ANGEBOT", "AUFTRAG", "ABGESCHLOSSEN"] as const;

export default async function DashboardPage() {
  const projects = await prisma.project.findMany({
    include: { customer: true },
    orderBy: { updatedAt: "desc" },
  });

  const customerCount = await prisma.customer.count();

  if (customerCount === 0) {
    return (
      <div>
        <PageHeader
          title="Übersicht"
          description="Deine Vertriebs-Pipeline für PV und Wärmepumpe"
        />
        <div className="p-4 sm:p-8">
          <EmptyState
            title="Noch keine Kunden angelegt"
            description="Lege deinen ersten Kunden an, um eine PV- oder Wärmepumpen-Anfrage zu erfassen."
            action={
              <LinkButton href="/kunden/neu">Ersten Kunden anlegen</LinkButton>
            }
          />
        </div>
      </div>
    );
  }

  const grouped = COLUMNS.map((status) => ({
    status,
    projects: projects.filter((p) => p.status === status),
  }));

  return (
    <div>
      <PageHeader
        title="Übersicht"
        description="Deine Vertriebs-Pipeline für PV und Wärmepumpe"
        action={<LinkButton href="/kunden/neu">+ Neuer Kunde</LinkButton>}
      />

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto p-4 sm:p-8 md:grid md:grid-cols-4 md:overflow-visible">
        {grouped.map((col) => (
          <div
            key={col.status}
            className="w-[85vw] shrink-0 snap-start md:w-auto"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <StatusBadge status={col.status} />
              <span className="text-xs text-slate-500">
                {col.projects.length}
              </span>
            </div>
            <div className="space-y-3">
              {col.projects.length === 0 && (
                <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-6 text-center text-xs text-slate-400">
                  Keine Vorgänge
                </p>
              )}
              {col.projects.map((project) => (
                <Link key={project.id} href={`/projekte/${project.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <p className="font-medium">
                      {project.customer.firstName} {project.customer.lastName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {[project.customer.street, project.customer.city]
                        .filter(Boolean)
                        .join(", ") || "Keine Adresse hinterlegt"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      {project.wantsPv && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          <Sun size={12} /> PV
                        </span>
                      )}
                      {project.wantsHeatPump && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                          <Flame size={12} /> WP
                        </span>
                      )}
                    </div>
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
          Alle {customerCount} Kunden ansehen
        </Link>
      </div>
    </div>
  );
}
