"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, FormGrid, TextInput, Select, Checkbox } from "@/components/form";
import { WizardActions } from "@/components/wizard";
import { SHADING_LEVELS } from "@/lib/options";
import type { KlimaRoom } from "@/generated/prisma/client";

type Row = {
  key: string;
  name: string;
  areaSqm: string;
  ceilingHeightM: string;
  shading: string;
  occupantsCount: string;
  hasHeatSources: boolean;
};

function fromExisting(rooms: KlimaRoom[]): Row[] {
  if (rooms.length === 0) {
    return [emptyRow(1)];
  }
  return rooms.map((r, i) => ({
    key: r.id,
    name: r.name ?? `Raum ${i + 1}`,
    areaSqm: r.areaSqm?.toString() ?? "",
    ceilingHeightM: r.ceilingHeightM?.toString() ?? "",
    shading: r.shading ?? "MITTEL",
    occupantsCount: r.occupantsCount?.toString() ?? "",
    hasHeatSources: r.hasHeatSources,
  }));
}

function emptyRow(n: number): Row {
  return {
    key: `new-${Date.now()}-${n}`,
    name: `Raum ${n}`,
    areaSqm: "",
    ceilingHeightM: "",
    shading: "MITTEL",
    occupantsCount: "",
    hasHeatSources: false,
  };
}

export function RaeumeForm({
  rooms,
  action,
  backHref,
}: {
  rooms: KlimaRoom[];
  action: (formData: FormData) => void;
  backHref: string;
}) {
  const [rows, setRows] = useState<Row[]>(() => fromExisting(rooms));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="rowCount" value={rows.length} />

      <div className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <input
                name={`name-${index}`}
                defaultValue={row.name}
                className="w-40 rounded-lg border-none bg-transparent text-sm font-semibold text-slate-500 focus:outline-none"
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRows((r) => r.filter((_, i) => i !== index))}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Raum entfernen"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <FormGrid>
              <Field label="Fläche (m²)" htmlFor={`areaSqm-${index}`}>
                <TextInput
                  id={`areaSqm-${index}`}
                  name={`areaSqm-${index}`}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  defaultValue={row.areaSqm}
                />
              </Field>
              <Field label="Deckenhöhe (m)" htmlFor={`ceilingHeightM-${index}`}>
                <TextInput
                  id={`ceilingHeightM-${index}`}
                  name={`ceilingHeightM-${index}`}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  defaultValue={row.ceilingHeightM}
                />
              </Field>
              <Field label="Sonneneinstrahlung / Verschattung" htmlFor={`shading-${index}`}>
                <Select
                  id={`shading-${index}`}
                  name={`shading-${index}`}
                  defaultValue={row.shading}
                >
                  {SHADING_LEVELS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Personen" htmlFor={`occupantsCount-${index}`}>
                <TextInput
                  id={`occupantsCount-${index}`}
                  name={`occupantsCount-${index}`}
                  type="number"
                  inputMode="numeric"
                  defaultValue={row.occupantsCount}
                />
              </Field>
              <div className="sm:col-span-2">
                <Checkbox
                  name={`hasHeatSources-${index}`}
                  label="Zusätzliche Wärmequellen (z.B. Küchengeräte, viel Elektronik)"
                  defaultChecked={row.hasHeatSources}
                />
              </div>
            </FormGrid>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows((r) => [...r, emptyRow(r.length + 1)])}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] py-3 text-sm font-medium text-slate-500 hover:border-emerald-600 hover:text-emerald-600"
      >
        <Plus size={16} />
        Weiteren Raum hinzufügen
      </button>

      <WizardActions backHref={backHref} />
    </form>
  );
}
