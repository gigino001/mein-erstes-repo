import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, EmptyState, Card } from "@/components/ui";
import { COMPONENT_CATEGORIES } from "@/lib/options";
import { DeleteComponentButton } from "./delete-button";

export default async function KomponentenPage() {
  const components = await prisma.component.findMany({
    orderBy: [{ category: "asc" }, { manufacturer: "asc" }],
  });

  if (components.length === 0) {
    return (
      <div>
        <PageHeader
          title="Komponenten"
          description="Stammdaten für Module, Wechselrichter, Speicher, Wärmepumpen & mehr"
          action={<LinkButton href="/komponenten/neu">+ Neue Komponente</LinkButton>}
        />
        <div className="p-4 sm:p-8">
          <EmptyState
            title="Noch keine Komponenten hinterlegt"
            description="Lege Module, Wechselrichter, Speicher und weitere Komponenten mit Preisen an, um sie im Angebot zu verwenden."
            action={<LinkButton href="/komponenten/neu">Erste Komponente anlegen</LinkButton>}
          />
        </div>
      </div>
    );
  }

  const grouped = COMPONENT_CATEGORIES.map((cat) => ({
    ...cat,
    items: components.filter((c) => c.category === cat.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader
        title="Komponenten"
        description="Stammdaten für Module, Wechselrichter, Speicher, Wärmepumpen & mehr"
        action={<LinkButton href="/komponenten/neu">+ Neue Komponente</LinkButton>}
      />

      <div className="space-y-8 p-4 sm:p-8">
        {grouped.map((group) => (
          <div key={group.value}>
            <h2 className="mb-3 text-sm font-semibold text-slate-500">
              {group.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((c) => (
                <Card key={c.id} className={!c.active ? "opacity-50" : undefined}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{c.manufacturer}</p>
                      <p className="text-sm text-slate-500">{c.name}</p>
                    </div>
                    <p className="shrink-0 font-medium text-emerald-600">
                      {c.price.toLocaleString("de-DE")} €
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
                    <Link
                      href={`/komponenten/${c.id}`}
                      className="text-xs font-medium text-slate-500 hover:text-emerald-600"
                    >
                      Bearbeiten
                    </Link>
                    <DeleteComponentButton componentId={c.id} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
