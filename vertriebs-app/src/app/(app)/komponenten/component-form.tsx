"use client";

import { useState } from "react";
import { Field, FormGrid, TextInput, Select, Checkbox } from "@/components/form";
import { Button } from "@/components/ui";
import { COMPONENT_CATEGORIES } from "@/lib/options";
import type { Component } from "@/generated/prisma/client";

type Specs = Record<string, number | undefined>;

function parseSpecs(specsJson: string): Specs {
  try {
    return JSON.parse(specsJson);
  } catch {
    return {};
  }
}

export function ComponentForm({
  action,
  existing,
}: {
  action: (formData: FormData) => void;
  existing?: Component;
}) {
  const [category, setCategory] = useState(existing?.category ?? "MODUL");
  const specs = existing ? parseSpecs(existing.specs) : {};

  return (
    <form action={action} className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <FormGrid>
          <Field label="Kategorie" htmlFor="category">
            <Select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {COMPONENT_CATEGORIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Hersteller" htmlFor="manufacturer">
            <TextInput
              id="manufacturer"
              name="manufacturer"
              required
              defaultValue={existing?.manufacturer ?? ""}
            />
          </Field>
          <Field label="Bezeichnung" htmlFor="name">
            <TextInput id="name" name="name" required defaultValue={existing?.name ?? ""} />
          </Field>
          <Field label="Preis (€)" htmlFor="price">
            <TextInput
              id="price"
              name="price"
              type="number"
              inputMode="decimal"
              step="0.01"
              required
              defaultValue={existing?.price ?? ""}
            />
          </Field>
        </FormGrid>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">
          Technische Daten
        </h2>
        <FormGrid>
          {category === "MODUL" && (
            <>
              <Field label="Leistung (Wp)" htmlFor="wattPeak">
                <TextInput
                  id="wattPeak"
                  name="wattPeak"
                  type="number"
                  defaultValue={specs.wattPeak ?? ""}
                />
              </Field>
              <Field label="Wirkungsgrad (%)" htmlFor="efficiencyPercent">
                <TextInput
                  id="efficiencyPercent"
                  name="efficiencyPercent"
                  type="number"
                  step="0.1"
                  defaultValue={specs.efficiencyPercent ?? ""}
                />
              </Field>
            </>
          )}
          {category === "WECHSELRICHTER" && (
            <>
              <Field label="Leistung (kW)" htmlFor="powerKw">
                <TextInput
                  id="powerKw"
                  name="powerKw"
                  type="number"
                  step="0.1"
                  defaultValue={specs.powerKw ?? ""}
                />
              </Field>
              <Field label="Anzahl MPP-Tracker" htmlFor="mpptCount">
                <TextInput
                  id="mpptCount"
                  name="mpptCount"
                  type="number"
                  defaultValue={specs.mpptCount ?? ""}
                />
              </Field>
            </>
          )}
          {category === "SPEICHER" && (
            <Field label="Kapazität (kWh)" htmlFor="capacityKwh">
              <TextInput
                id="capacityKwh"
                name="capacityKwh"
                type="number"
                step="0.1"
                defaultValue={specs.capacityKwh ?? ""}
              />
            </Field>
          )}
          {category === "WALLBOX" && (
            <Field label="Ladeleistung (kW)" htmlFor="chargingPowerKw">
              <TextInput
                id="chargingPowerKw"
                name="chargingPowerKw"
                type="number"
                step="0.1"
                defaultValue={specs.chargingPowerKw ?? ""}
              />
            </Field>
          )}
          {category === "WAERMEPUMPE" && (
            <>
              <Field label="Heizleistung (kW)" htmlFor="heatingPowerKw">
                <TextInput
                  id="heatingPowerKw"
                  name="heatingPowerKw"
                  type="number"
                  step="0.1"
                  defaultValue={specs.heatingPowerKw ?? ""}
                />
              </Field>
              <Field
                label="Jahresarbeitszahl (JAZ)"
                htmlFor="jaz"
                hint="Überschreibt die Standard-Faustformel in der Berechnung"
              >
                <TextInput
                  id="jaz"
                  name="jaz"
                  type="number"
                  step="0.1"
                  defaultValue={specs.jaz ?? ""}
                />
              </Field>
            </>
          )}
          {category === "PUFFERSPEICHER" && (
            <Field label="Volumen (Liter)" htmlFor="volumeLiters">
              <TextInput
                id="volumeLiters"
                name="volumeLiters"
                type="number"
                defaultValue={specs.volumeLiters ?? ""}
              />
            </Field>
          )}
          {(category === "ENERGIEMANAGER" || category === "MONTAGESYSTEM") && (
            <p className="text-sm text-slate-400 sm:col-span-2">
              Keine zusätzlichen technischen Daten erforderlich.
            </p>
          )}
        </FormGrid>
      </div>

      {existing && (
        <Checkbox name="active" label="Aktiv (in Auswahllisten sichtbar)" defaultChecked={existing.active} />
      )}

      <Button type="submit" className="w-full sm:w-auto">
        {existing ? "Speichern" : "Komponente anlegen"}
      </Button>
    </form>
  );
}
