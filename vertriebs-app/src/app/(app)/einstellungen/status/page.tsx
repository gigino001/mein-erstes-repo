import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { Field, TextInput } from "@/components/form";
import { Button } from "@/components/ui";
import { AUFTRAGSVARIANTEN } from "@/lib/options";
import {
  createStatusAction,
  renameStatusAction,
  deleteStatusAction,
  moveStatusAction,
} from "./actions";

export default async function StatusEinstellungenPage() {
  const statuses = await prisma.statusDefinition.findMany({
    orderBy: [{ variantType: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Status-Workflows"
        description="Lege je Auftragsvariante die Status-Schritte fest, die ein Vorgang durchläuft."
      />

      <div className="space-y-8 p-4 sm:p-8">
        {AUFTRAGSVARIANTEN.map((variant) => {
          const variantStatuses = statuses.filter(
            (s) => s.variantType === variant.value
          );
          return (
            <div key={variant.value}>
              <h2 className="mb-3 text-sm font-semibold text-slate-500">
                {variant.label}
              </h2>
              <Card>
                <ul className="space-y-2">
                  {variantStatuses.map((status, index) => (
                    <li
                      key={status.id}
                      className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800"
                    >
                      <div className="flex shrink-0 flex-col">
                        <form action={moveStatusAction.bind(null, variant.value, status.id, "up")}>
                          <button
                            type="submit"
                            disabled={index === 0}
                            className="rounded p-0.5 text-slate-400 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700"
                            aria-label="Nach oben"
                          >
                            <ArrowUp size={14} />
                          </button>
                        </form>
                        <form
                          action={moveStatusAction.bind(null, variant.value, status.id, "down")}
                        >
                          <button
                            type="submit"
                            disabled={index === variantStatuses.length - 1}
                            className="rounded p-0.5 text-slate-400 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700"
                            aria-label="Nach unten"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </form>
                      </div>

                      <form
                        action={renameStatusAction.bind(null, status.id)}
                        className="flex flex-1 flex-wrap items-center gap-2"
                      >
                        <input
                          name="name"
                          defaultValue={status.name}
                          className="min-w-[10rem] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
                        />
                        <label className="flex items-center gap-1.5 text-xs text-slate-500">
                          <input
                            type="checkbox"
                            name="isTerminal"
                            defaultChecked={status.isTerminal}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          Abschluss-Status
                        </label>
                        <button
                          type="submit"
                          className="rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                        >
                          Speichern
                        </button>
                      </form>

                      <form action={deleteStatusAction.bind(null, status.id)}>
                        <button
                          type="submit"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Status löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>

                <form
                  action={createStatusAction.bind(null, variant.value)}
                  className="mt-3 flex items-end gap-2 border-t border-[var(--border)] pt-3"
                >
                  <div className="flex-1">
                    <Field label="Neuer Status" htmlFor={`new-${variant.value}`}>
                      <TextInput
                        id={`new-${variant.value}`}
                        name="name"
                        placeholder="z.B. Material bestellt"
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
          );
        })}
      </div>
    </div>
  );
}
