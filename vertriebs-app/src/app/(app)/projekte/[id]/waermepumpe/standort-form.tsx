import { Field, FormGrid, TextInput } from "@/components/form";
import { WizardActions } from "@/components/wizard";
import type { HeatPumpData } from "@/generated/prisma/client";

export function StandortForm({
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
          <Field label="Standort (Ort / PLZ)" htmlFor="location">
            <TextInput id="location" name="location" defaultValue={data.location ?? ""} />
          </Field>
          <Field
            label="Norm-Außentemperatur (°C)"
            htmlFor="designOutdoorTemp"
            hint="Auslegungsaußentemperatur nach Klimazone, z.B. -12 bis -16 °C"
          >
            <TextInput
              id="designOutdoorTemp"
              name="designOutdoorTemp"
              type="number"
              inputMode="decimal"
              step="0.1"
              defaultValue={data.designOutdoorTemp ?? ""}
            />
          </Field>
        </FormGrid>
      </div>

      <WizardActions backHref={backHref} />
    </form>
  );
}
