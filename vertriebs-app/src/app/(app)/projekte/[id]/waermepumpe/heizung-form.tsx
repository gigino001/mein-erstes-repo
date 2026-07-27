import { Field, FormGrid, TextInput, Select } from "@/components/form";
import { WizardActions } from "@/components/wizard";
import { HEATING_TYPES } from "@/lib/options";
import { UNIT_BY_HEATING_TYPE } from "./steps";
import type { HeatPumpData } from "@/generated/prisma/client";

export function HeizungForm({
  data,
  action,
  backHref,
}: {
  data: HeatPumpData;
  action: (formData: FormData) => void;
  backHref: string;
}) {
  const unit = data.currentHeatingType
    ? UNIT_BY_HEATING_TYPE[data.currentHeatingType]
    : "Einheit";

  return (
    <form action={action} className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <FormGrid>
          <Field label="Bisherige Heizung" htmlFor="currentHeatingType">
            <Select
              id="currentHeatingType"
              name="currentHeatingType"
              defaultValue={data.currentHeatingType ?? ""}
            >
              <option value="">– Bitte wählen –</option>
              {HEATING_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={`Jahresverbrauch (${unit})`}
            htmlFor="annualConsumptionValue"
            hint="Einheit richtet sich automatisch nach dem Heizungstyp"
          >
            <TextInput
              id="annualConsumptionValue"
              name="annualConsumptionValue"
              type="number"
              inputMode="decimal"
              step="0.1"
              defaultValue={data.annualConsumptionValue ?? ""}
            />
          </Field>
        </FormGrid>
      </div>

      <WizardActions backHref={backHref} />
    </form>
  );
}
