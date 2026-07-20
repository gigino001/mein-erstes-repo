"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, FormGrid, TextInput, Select } from "@/components/form";
import { WizardActions } from "@/components/wizard";
import { ORIENTATIONS, ROOF_SHAPES, SHADING_LEVELS } from "@/lib/options";
import type { RoofSurface } from "@/generated/prisma/client";

type Row = {
  key: string;
  name: string;
  roofShape: string;
  orientation: string;
  tiltDegrees: string;
  areaSqm: string;
  usableAreaSqm: string;
  shading: string;
};

function fromExisting(surfaces: RoofSurface[]): Row[] {
  if (surfaces.length === 0) {
    return [emptyRow(1)];
  }
  return surfaces.map((s, i) => ({
    key: s.id,
    name: s.name ?? `Dachfläche ${i + 1}`,
    roofShape: s.roofShape ?? "",
    orientation: s.orientation ?? "",
    tiltDegrees: s.tiltDegrees?.toString() ?? "",
    areaSqm: s.areaSqm?.toString() ?? "",
    usableAreaSqm: s.usableAreaSqm?.toString() ?? "",
    shading: s.shading ?? "KEINE",
  }));
}

function emptyRow(n: number): Row {
  return {
    key: `new-${Date.now()}-${n}`,
    name: `Dachfläche ${n}`,
    roofShape: "",
    orientation: "",
    tiltDegrees: "",
    areaSqm: "",
    usableAreaSqm: "",
    shading: "KEINE",
  };
}

export function DachForm({
  roofMaterial,
  roofSurfaces,
  action,
  backHref,
}: {
  roofMaterial: string | null;
  roofSurfaces: RoofSurface[];
  action: (formData: FormData) => void;
  backHref: string;
}) {
  const [rows, setRows] = useState<Row[]>(() => fromExisting(roofSurfaces));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="rowCount" value={rows.length} />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <Field label="Dachmaterial" htmlFor="roofMaterial">
          <TextInput
            id="roofMaterial"
            name="roofMaterial"
            defaultValue={roofMaterial ?? ""}
            placeholder="z.B. Tondachziegel, Trapezblech…"
          />
        </Field>
      </div>

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
                  aria-label="Dachfläche entfernen"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <FormGrid>
              <Field label="Dachform" htmlFor={`roofShape-${index}`}>
                <Select
                  id={`roofShape-${index}`}
                  name={`roofShape-${index}`}
                  defaultValue={row.roofShape}
                >
                  <option value="">– Bitte wählen –</option>
                  {ROOF_SHAPES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Ausrichtung" htmlFor={`orientation-${index}`}>
                <Select
                  id={`orientation-${index}`}
                  name={`orientation-${index}`}
                  defaultValue={row.orientation}
                >
                  <option value="">– Bitte wählen –</option>
                  {ORIENTATIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Dachneigung (°)" htmlFor={`tiltDegrees-${index}`}>
                <TextInput
                  id={`tiltDegrees-${index}`}
                  name={`tiltDegrees-${index}`}
                  type="number"
                  inputMode="numeric"
                  defaultValue={row.tiltDegrees}
                />
              </Field>
              <Field label="Verschattung" htmlFor={`shading-${index}`}>
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
              <Field label="Dachfläche (m²)" htmlFor={`areaSqm-${index}`}>
                <TextInput
                  id={`areaSqm-${index}`}
                  name={`areaSqm-${index}`}
                  type="number"
                  inputMode="decimal"
                  defaultValue={row.areaSqm}
                />
              </Field>
              <Field label="nutzbare Fläche (m²)" htmlFor={`usableAreaSqm-${index}`}>
                <TextInput
                  id={`usableAreaSqm-${index}`}
                  name={`usableAreaSqm-${index}`}
                  type="number"
                  inputMode="decimal"
                  defaultValue={row.usableAreaSqm}
                />
              </Field>
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
        Weitere Dachfläche hinzufügen
      </button>

      <WizardActions backHref={backHref} />
    </form>
  );
}
