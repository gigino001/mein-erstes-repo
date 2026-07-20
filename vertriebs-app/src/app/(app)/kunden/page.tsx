import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, EmptyState, Card } from "@/components/ui";
import { labelFor, BUILDING_TYPES } from "@/lib/options";

export default async function KundenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { city: { contains: q } },
            { street: { contains: q } },
          ],
        }
      : undefined,
    include: { projects: { select: { status: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Kunden"
        description={`${customers.length} Kunde${customers.length === 1 ? "" : "n"}`}
        action={<LinkButton href="/kunden/neu">+ Neuer Kunde</LinkButton>}
      />

      <div className="p-4 sm:p-8">
        <form className="mb-5">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Name, Straße oder Ort suchen…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-10 pr-4 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
        </form>

        {customers.length === 0 ? (
          <EmptyState
            title={q ? "Keine Kunden gefunden" : "Noch keine Kunden angelegt"}
            description={
              q
                ? "Versuche einen anderen Suchbegriff."
                : "Lege deinen ersten Kunden an, um loszulegen."
            }
            action={
              !q && <LinkButton href="/kunden/neu">Kunden anlegen</LinkButton>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <Link key={customer.id} href={`/kunden/${customer.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <p className="font-medium">
                    {customer.firstName} {customer.lastName}
                  </p>
                  {customer.company && (
                    <p className="text-xs text-slate-500">{customer.company}</p>
                  )}
                  <p className="mt-1 text-sm text-slate-500">
                    {[customer.street, [customer.postalCode, customer.city].filter(Boolean).join(" ")]
                      .filter(Boolean)
                      .join(", ") || "Keine Adresse hinterlegt"}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {labelFor(BUILDING_TYPES, customer.buildingType)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {customer.projects.length} Vorgang
                      {customer.projects.length === 1 ? "" : "änge"}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
