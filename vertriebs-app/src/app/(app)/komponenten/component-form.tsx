"use client";

import { useState } from "react";
import { Field, FormGrid, TextInput, Textarea, Select, Checkbox } from "@/components/form";
import { Button } from "@/components/ui";
import { COMPONENT_CATEGORIES, COMPONENT_UNITS } from "@/lib/options";
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
          <Field
            label="Hersteller"
            htmlFor="manufacturer"
            hint="Optional, z.B. bei Dienstleistungen ohne Hersteller"
          >
            <TextInput
              id="manufacturer"
              name="manufacturer"
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
          <Field label="Einheit" htmlFor="unit">
            <Select id="unit" name="unit" defaultValue={existing?.unit ?? "Stück"}>
              {COMPONENT_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Produktnummer" htmlFor="productNumber" hint="Optional, z.B. Artikelnummer">
            <TextInput
              id="productNumber"
              name="productNumber"
              defaultValue={existing?.productNumber ?? ""}
            />
          </Field>
          <Field label="Ausführliche Beschreibung" htmlFor="longDescription" full>
            <Textarea
              id="longDescription"
              name="longDescription"
              rows={3}
              defaultValue={existing?.longDescription ?? ""}
            />
          </Field>
        </FormGrid>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">
          Steuer &amp; Rabattgrenze
        </h2>
        <FormGrid>
          <Field label="Umsatzsteuersatz (%)" htmlFor="vatRatePercent">
            <TextInput
              id="vatRatePercent"
              name="vatRatePercent"
              type="number"
              step="0.1"
              defaultValue={existing?.vatRatePercent ?? 19}
            />
          </Field>
          <Field label="Max. Rabatt (%)" htmlFor="maxDiscountPercent" hint="Leer lassen = kein Prozent-Limit">
            <TextInput
              id="maxDiscountPercent"
              name="maxDiscountPercent"
              type="number"
              step="0.1"
              defaultValue={existing?.maxDiscountPercent ?? ""}
            />
          </Field>
          <Field
            label="Mindestpreis nach Rabatt (€)"
            htmlFor="maxDiscountAmount"
            hint="Fester Bodenpreis, unter den nicht rabattiert werden darf"
          >
            <TextInput
              id="maxDiscountAmount"
              name="maxDiscountAmount"
              type="number"
              step="0.01"
              defaultValue={existing?.maxDiscountAmount ?? ""}
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
          {[
            "ENERGIEMANAGER",
            "MONTAGESYSTEM",
            "KLIMAGERAET",
            "MONTAGE",
            "DIENSTLEISTUNG",
            "GARANTIE",
            "SONSTIGES",
          ].includes(category) && (
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
