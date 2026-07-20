import { Field, FormGrid, Select } from "@/components/form";
import { WizardActions } from "@/components/wizard";
import type { Component, HeatPumpData } from "@/generated/prisma/client";

function ComponentSelect({
  id,
  name,
  components,
  defaultValue,
  placeholder,
}: {
  id: string;
  name: string;
  components: Component[];
  defaultValue?: string | null;
  placeholder: string;
}) {
  return (
    <Select id={id} name={name} defaultValue={defaultValue ?? ""}>
      <option value="">{placeholder}</option>
      {components.map((c) => (
        <option key={c.id} value={c.id}>
          {c.manufacturer} {c.name} – {c.price.toLocaleString("de-DE")} €
        </option>
      ))}
    </Select>
  );
}

export function WpKomponentenForm({
  data,
  components,
  action,
  backHref,
}: {
  data: HeatPumpData;
  components: Record<string, Component[]>;
  action: (formData: FormData) => void;
  backHref: string;
}) {
  const noComponents = (components.WAERMEPUMPE ?? []).length === 0;

  return (
    <form action={action} className="space-y-6">
      {noComponents && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Es sind noch keine Wärmepumpen-Geräte hinterlegt. Lege zuerst unter{" "}
          <span className="font-medium">Komponenten</span> ein Gerät an.
        </p>
      )}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <FormGrid>
          <Field label="Wärmepumpe" htmlFor="heatPumpComponentId" full>
            <ComponentSelect
              id="heatPumpComponentId"
              name="heatPumpComponentId"
              components={components.WAERMEPUMPE ?? []}
              defaultValue={data.heatPumpComponentId}
              placeholder="– Gerät wählen –"
            />
          </Field>
          <Field label="Pufferspeicher" htmlFor="bufferComponentId" full>
            <ComponentSelect
              id="bufferComponentId"
              name="bufferComponentId"
              components={components.PUFFERSPEICHER ?? []}
              defaultValue={data.bufferComponentId}
              placeholder="– kein Pufferspeicher –"
            />
          </Field>
        </FormGrid>
      </div>

      <WizardActions backHref={backHref} nextLabel="Berechnen" />
    </form>
  );
}
