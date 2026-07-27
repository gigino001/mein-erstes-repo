import { Field, FormGrid, TextInput, Checkbox } from "@/components/form";
import { WizardActions } from "@/components/wizard";
import type { PvData } from "@/generated/prisma/client";

export function VerbrauchForm({
  pvData,
  action,
  backHref,
}: {
  pvData: PvData;
  action: (formData: FormData) => void;
  backHref: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <FormGrid>
          <Field label="Jahresverbrauch (kWh)" htmlFor="annualConsumptionKwh">
            <TextInput
              id="annualConsumptionKwh"
              name="annualConsumptionKwh"
              type="number"
              inputMode="decimal"
              step="0.1"
              defaultValue={pvData.annualConsumptionKwh ?? ""}
              required
            />
          </Field>
          <Field label="Anzahl Personen" htmlFor="personsCount">
            <TextInput
              id="personsCount"
              name="personsCount"
              type="number"
              inputMode="numeric"
              defaultValue={pvData.personsCount ?? ""}
            />
          </Field>
        </FormGrid>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Checkbox
          name="homeOffice"
          label="Homeoffice"
          defaultChecked={pvData.homeOffice}
        />
        <Checkbox
          name="hasHeatPumpExisting"
          label="Wärmepumpe bereits vorhanden"
          defaultChecked={pvData.hasHeatPumpExisting}
        />
        <Checkbox
          name="hasWallbox"
          label="Wallbox vorhanden"
          defaultChecked={pvData.hasWallbox}
        />
        <Checkbox name="hasPool" label="Pool vorhanden" defaultChecked={pvData.hasPool} />
        <Checkbox
          name="hasAirConditioning"
          label="Klimaanlage vorhanden"
          defaultChecked={pvData.hasAirConditioning}
        />
      </div>

      <WizardActions backHref={backHref} />
    </form>
  );
}
