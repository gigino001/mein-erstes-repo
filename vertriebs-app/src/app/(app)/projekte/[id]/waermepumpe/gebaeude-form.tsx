import { Field, FormGrid, TextInput, Select } from "@/components/form";
import { WizardActions } from "@/components/wizard";
import { INSULATION_STANDARDS } from "@/lib/options";
import type { HeatPumpData } from "@/generated/prisma/client";

export function GebaeudeForm({
  data,
  action,
  backHref,
}: {
  data: HeatPumpData;
  action: (formData: FormData) => void;
  backHref: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <FormGrid>
          <Field label="Baujahr" htmlFor="buildYear">
            <TextInput
              id="buildYear"
              name="buildYear"
              type="number"
              inputMode="numeric"
              defaultValue={data.buildYear ?? ""}
            />
          </Field>
          <Field label="Anzahl Etagen" htmlFor="floorsCount">
            <TextInput
              id="floorsCount"
              name="floorsCount"
              type="number"
              inputMode="numeric"
              defaultValue={data.floorsCount ?? ""}
            />
          </Field>
          <Field label="Wohnfläche (m²)" htmlFor="livingAreaSqm">
            <TextInput
              id="livingAreaSqm"
              name="livingAreaSqm"
              type="number"
              inputMode="decimal"
              step="0.1"
              defaultValue={data.livingAreaSqm ?? ""}
            />
          </Field>
          <Field label="Beheizte Fläche (m²)" htmlFor="heatedAreaSqm">
            <TextInput
              id="heatedAreaSqm"
              name="heatedAreaSqm"
              type="number"
              inputMode="decimal"
              step="0.1"
              defaultValue={data.heatedAreaSqm ?? ""}
              required
            />
          </Field>
          <Field label="Dämmstandard" htmlFor="insulationStandard">
            <Select
              id="insulationStandard"
              name="insulationStandard"
              defaultValue={data.insulationStandard ?? ""}
            >
              <option value="">– Bitte wählen –</option>
              {INSULATION_STANDARDS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fenster" htmlFor="windowType">
            <TextInput
              id="windowType"
              name="windowType"
              placeholder="z.B. 2-fach verglast"
              defaultValue={data.windowType ?? ""}
            />
          </Field>
        </FormGrid>
      </div>

      <WizardActions backHref={backHref} />
    </form>
  );
}
