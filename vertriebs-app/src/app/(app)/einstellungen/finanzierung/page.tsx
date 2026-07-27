import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button } from "@/components/ui";
import { Field, TextInput } from "@/components/form";
import {
  createFinancingRateAction,
  updateFinancingRateAction,
  deleteFinancingRateAction,
} from "./actions";

export default async function FinanzierungEinstellungenPage() {
  const rates = await prisma.financingRate.findMany({
    orderBy: [{ active: "desc" }, { bankName: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Finanzierungskonditionen"
        description="Bank-Konditionen für die Finanzierungsrechnung in der Preisfindung."
      />

      <div className="p-4 sm:p-8 max-w-2xl">
        <Card>
          {rates.length === 0 && (
            <p className="mb-2 text-sm text-slate-400">
              Noch keine Finanzierungskonditionen hinterlegt.
            </p>
          )}
          <ul className="space-y-2">
            {rates.map((rate) => (
              <li
                key={rate.id}
                className={`flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800 ${
                  rate.active ? "" : "opacity-50"
                }`}
              >
                <form
                  action={updateFinancingRateAction.bind(null, rate.id)}
                  className="flex flex-1 flex-wrap items-center gap-2"
                >
                  <input
                    name="bankName"
                    defaultValue={rate.bankName}
                    className="min-w-[10rem] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      name="interestRatePercent"
                      type="number"
                      step="0.01"
                      defaultValue={rate.interestRatePercent}
                      className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
                    />
                    <span className="text-xs text-slate-400">% p.a.</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={rate.active}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    Aktiv
                  </label>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Speichern
                  </button>
                </form>

                <form action={deleteFinancingRateAction.bind(null, rate.id)}>
                  <button
                    type="submit"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Konditionen löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </li>
            ))}
          </ul>

          <form
            action={createFinancingRateAction}
            className="mt-3 flex flex-wrap items-end gap-2 border-t border-[var(--border)] pt-3"
          >
            <div className="min-w-[10rem] flex-1">
              <Field label="Bank" htmlFor="bankName">
                <TextInput id="bankName" name="bankName" placeholder="z.B. Musterbank" required />
              </Field>
            </div>
            <div className="w-28">
              <Field label="Zinssatz (% p.a.)" htmlFor="interestRatePercent">
                <TextInput
                  id="interestRatePercent"
                  name="interestRatePercent"
                  type="number"
                  step="0.01"
                  required
                />
              </Field>
            </div>
            <Button type="submit" variant="secondary" className="shrink-0">
              + Hinzufügen
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
