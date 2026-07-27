import { Field, FormGrid, TextInput, Select } from "@/components/form";
import { WizardActions } from "@/components/wizard";
import type { Component, ClimaData } from "@/generated/prisma/client";

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

export function KlimaKomponentenForm({
  climaData,
  components,
  action,
  backHref,
}: {
  climaData: ClimaData;
  components: Record<string, Component[]>;
  action: (formData: FormData) => void;
  backHref: string;
}) {
  const noComponents = (components.KLIMAGERAET ?? []).length === 0;

  return (
    <form action={action} className="space-y-6">
      {noComponents && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Es sind noch keine Klimageräte hinterlegt. Lege zuerst unter{" "}
          <span className="font-medium">Komponenten</span> ein Gerät an.
        </p>
      )}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <FormGrid>
          <Field label="Klimagerät" htmlFor="climaComponentId" full>
            <ComponentSelect
              id="climaComponentId"
              name="climaComponentId"
              components={components.KLIMAGERAET ?? []}
              defaultValue={climaData.climaComponentId}
              placeholder="– Gerät wählen –"
            />
          </Field>
          <Field label="Anzahl Inneneinheiten" htmlFor="unitsCount">
            <TextInput
              id="unitsCount"
              name="unitsCount"
              type="number"
              inputMode="numeric"
              defaultValue={climaData.unitsCount ?? ""}
            />
          </Field>
        </FormGrid>
      </div>

      <WizardActions backHref={backHref} nextLabel="Berechnen" />
    </form>
  );
}
