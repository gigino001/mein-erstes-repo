import { Field, FormGrid, TextInput, Select } from "@/components/form";
import { WizardActions } from "@/components/wizard";
import { HEAT_EMITTER_TYPES } from "@/lib/options";
import type { HeatPumpData } from "@/generated/prisma/client";

export function HeizkoerperForm({
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
        <h2 className="mb-3 text-sm font-semibold text-slate-500">Heizkörper</h2>
        <FormGrid>
          <Field label="Heizkörpertyp" htmlFor="heatEmitterType">
            <Select
              id="heatEmitterType"
              name="heatEmitterType"
              defaultValue={data.heatEmitterType ?? ""}
            >
              <option value="">– Bitte wählen –</option>
              {HEAT_EMITTER_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Vorlauftemperatur (°C)" htmlFor="flowTemperature">
            <TextInput
              id="flowTemperature"
              name="flowTemperature"
              type="number"
              inputMode="decimal"
              step="0.1"
              defaultValue={data.flowTemperature ?? ""}
            />
          </Field>
        </FormGrid>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">Warmwasser</h2>
        <FormGrid>
          <Field label="Anzahl Personen" htmlFor="personsCount">
            <TextInput
              id="personsCount"
              name="personsCount"
              type="number"
              inputMode="numeric"
              defaultValue={data.personsCount ?? ""}
            />
          </Field>
          <Field label="Speichergröße (Liter)" htmlFor="hotWaterStorageLiters">
            <TextInput
              id="hotWaterStorageLiters"
              name="hotWaterStorageLiters"
              type="number"
              inputMode="numeric"
              defaultValue={data.hotWaterStorageLiters ?? ""}
            />
          </Field>
        </FormGrid>
      </div>

      <WizardActions backHref={backHref} />
    </form>
  );
}
