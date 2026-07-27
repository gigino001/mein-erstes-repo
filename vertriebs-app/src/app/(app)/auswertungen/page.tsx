import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import {
  getRevenueByMonth,
  getAbschlussquote,
  getPipelineDistribution,
  getRevenueByOwner,
} from "@/lib/analytics";

function formatEur(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export default async function AuswertungenPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [revenueByMonth, abschlussquote, pipeline, revenueByOwner] = await Promise.all([
    getRevenueByMonth(),
    getAbschlussquote(),
    getPipelineDistribution(),
    getRevenueByOwner(),
  ]);

  const maxRevenue = Math.max(1, ...revenueByMonth.map((m) => m.revenueNet));
  const maxPipelineCount = Math.max(1, ...pipeline.map((p) => p.count));
  const quotePercent =
    abschlussquote.total > 0
      ? Math.round((abschlussquote.won / abschlussquote.total) * 100)
      : 0;

  return (
    <div>
      <PageHeader
        title="Auswertungen"
        description="Umsatz, Abschlussquote und Pipeline auf Basis abgeschlossener Vorgänge."
      />

      <div className="space-y-4 p-4 sm:p-8">
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-slate-500">
            Umsatz abgeschlossener Vorgänge
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Netto-Verkaufspreis, gruppiert nach Anlagemonat des Vorgangs. Nur
            Vorgänge, bei denen alle Leistungen den Status &bdquo;Abgeschlossen&ldquo;
            erreicht haben.
          </p>
          {revenueByMonth.length === 0 ? (
            <EmptyState
              title="Noch kein Umsatz"
              description="Sobald Vorgänge vollständig abgeschlossen sind, erscheint hier der Umsatzverlauf."
            />
          ) : (
            <div className="flex items-end gap-3 overflow-x-auto pb-2">
              {revenueByMonth.map((m) => (
                <div key={m.label} className="flex min-w-[3.5rem] flex-col items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {formatEur(m.revenueNet)}
                  </span>
                  <div
                    className="w-8 rounded-t-lg bg-emerald-600"
                    style={{
                      height: `${Math.max(4, (m.revenueNet / maxRevenue) * 160)}px`,
                    }}
                  />
                  <span className="text-xs text-slate-400">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-1 text-sm font-semibold text-slate-500">Abschlussquote</h2>
            <p className="mb-4 text-xs text-slate-400">
              Anteil abgeschlossener Leistungen an allen angelegten Leistungen.
            </p>
            {abschlussquote.total === 0 ? (
              <EmptyState title="Noch keine Vorgänge" />
            ) : (
              <>
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-emerald-600">
                    {quotePercent}%
                  </span>
                  <span className="text-sm text-slate-400">
                    {abschlussquote.won} von {abschlussquote.total} Leistungen
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {abschlussquote.perVariant.map((v) => {
                    const percent = Math.round((v.won / v.total) * 100);
                    return (
                      <li key={v.label}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium">{v.label}</span>
                          <span className="text-slate-400">
                            {v.won}/{v.total}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-2 rounded-full bg-emerald-600"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Card>

          <Card>
            <h2 className="mb-1 text-sm font-semibold text-slate-500">
              Pipeline-Verteilung
            </h2>
            <p className="mb-4 text-xs text-slate-400">
              Kunden nach Interessenten-Status.
            </p>
            <ul className="space-y-2.5">
              {pipeline.map((p) => (
                <li key={p.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{p.label}</span>
                    <span className="text-slate-400">{p.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-emerald-600"
                      style={{ width: `${(p.count / maxPipelineCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card>
          <h2 className="mb-1 text-sm font-semibold text-slate-500">Nach Vertriebler</h2>
          <p className="mb-4 text-xs text-slate-400">
            Umsatz und Anzahl abgeschlossener Vorgänge je Betreuer.
          </p>
          {revenueByOwner.length === 0 ? (
            <EmptyState title="Noch keine abgeschlossenen Vorgänge" />
          ) : (
            <ul className="space-y-2">
              {revenueByOwner.map((o) => (
                <li
                  key={o.name}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
                >
                  <span className="font-medium">{o.name}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-slate-400">{o.wonCount} Vorgänge</span>
                    <span className="font-semibold">{formatEur(o.revenueNet)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
