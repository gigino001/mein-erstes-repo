import { Field, FormGrid, Select } from "@/components/form";
import { WizardActions } from "@/components/wizard";
import { INSULATION_STANDARDS } from "@/lib/options";
import type { ClimaData } from "@/generated/prisma/client";

export function GebaeudeForm({
  climaData,
  action,
  backHref,
}: {
  climaData: ClimaData;
  action: (formData: FormData) => void;
  backHref: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <FormGrid>
          <Field label="Dämmstandard" htmlFor="insulationStandard" full>
            <Select
              id="insulationStandard"
              name="insulationStandard"
              defaultValue={climaData.insulationStandard ?? ""}
            >
              <option value="">– Bitte wählen –</option>
              {INSULATION_STANDARDS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>
      </div>

      <WizardActions backHref={backHref} />
    </form>
  );
}
