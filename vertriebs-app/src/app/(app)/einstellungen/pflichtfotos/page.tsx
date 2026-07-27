import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button } from "@/components/ui";
import { Field, TextInput } from "@/components/form";
import { AUFTRAGSVARIANTEN } from "@/lib/options";
import {
  createRequiredPhotoTypeAction,
  renameRequiredPhotoTypeAction,
  deleteRequiredPhotoTypeAction,
  moveRequiredPhotoTypeAction,
} from "./actions";

export default async function PflichtfotosEinstellungenPage() {
  const types = await prisma.requiredPhotoType.findMany({
    orderBy: [{ variantType: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Pflichtfotos"
        description="Lege je Auftragsvariante fest, welche Fotos bei einem Vorgang dokumentiert werden sollen."
      />

      <div className="space-y-8 p-4 sm:p-8">
        {AUFTRAGSVARIANTEN.map((variant) => {
          const variantTypes = types.filter((t) => t.variantType === variant.value);
          return (
            <div key={variant.value}>
              <h2 className="mb-3 text-sm font-semibold text-slate-500">
                {variant.label}
              </h2>
              <Card>
                {variantTypes.length === 0 && (
                  <p className="mb-2 text-sm text-slate-400">
                    Noch keine Pflichtfotos hinterlegt.
                  </p>
                )}
                <ul className="space-y-2">
                  {variantTypes.map((type, index) => (
                    <li
                      key={type.id}
                      className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800"
                    >
                      <div className="flex shrink-0 flex-col">
                        <form
                          action={moveRequiredPhotoTypeAction.bind(null, variant.value, type.id, "up")}
                        >
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
                          action={moveRequiredPhotoTypeAction.bind(null, variant.value, type.id, "down")}
                        >
                          <button
                            type="submit"
                            disabled={index === variantTypes.length - 1}
                            className="rounded p-0.5 text-slate-400 hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-700"
                            aria-label="Nach unten"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </form>
                      </div>

                      <form
                        action={renameRequiredPhotoTypeAction.bind(null, type.id)}
                        className="flex flex-1 flex-wrap items-center gap-2"
                      >
                        <input
                          name="label"
                          defaultValue={type.label}
                          className="min-w-[10rem] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                        >
                          Speichern
                        </button>
                      </form>

                      <form action={deleteRequiredPhotoTypeAction.bind(null, type.id)}>
                        <button
                          type="submit"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Pflichtfoto löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>

                <form
                  action={createRequiredPhotoTypeAction.bind(null, variant.value)}
                  className="mt-3 flex items-end gap-2 border-t border-[var(--border)] pt-3"
                >
                  <div className="flex-1">
                    <Field label="Neues Pflichtfoto" htmlFor={`new-${variant.value}`}>
                      <TextInput
                        id={`new-${variant.value}`}
                        name="label"
                        placeholder="z.B. Zählerschrank"
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
