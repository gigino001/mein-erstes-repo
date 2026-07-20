import { Field, FormGrid, TextInput, Select } from "@/components/form";
import { WizardActions } from "@/components/wizard";
import type { Component, PvData } from "@/generated/prisma/client";

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

export function KomponentenForm({
  pvData,
  components,
  action,
  backHref,
}: {
  pvData: PvData;
  components: Record<string, Component[]>;
  action: (formData: FormData) => void;
  backHref: string;
}) {
  const noComponents = Object.values(components).every((list) => list.length === 0);

  return (
    <form action={action} className="space-y-6">
      {noComponents && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Es sind noch keine Komponenten hinterlegt. Lege zuerst unter{" "}
          <span className="font-medium">Komponenten</span> Module, Wechselrichter
          etc. an.
        </p>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">
          Module &amp; Wechselrichter
        </h2>
        <FormGrid>
          <Field label="PV-Modul" htmlFor="moduleComponentId">
            <ComponentSelect
              id="moduleComponentId"
              name="moduleComponentId"
              components={components.MODUL ?? []}
              defaultValue={pvData.moduleComponentId}
              placeholder="– Modul wählen –"
            />
          </Field>
          <Field label="Anzahl Module" htmlFor="moduleCount">
            <TextInput
              id="moduleCount"
              name="moduleCount"
              type="number"
              inputMode="numeric"
              defaultValue={pvData.moduleCount ?? ""}
            />
          </Field>
          <Field label="Wechselrichter" htmlFor="inverterComponentId" full>
            <ComponentSelect
              id="inverterComponentId"
              name="inverterComponentId"
              components={components.WECHSELRICHTER ?? []}
              defaultValue={pvData.inverterComponentId}
              placeholder="– Wechselrichter wählen –"
            />
          </Field>
        </FormGrid>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">
          Speicher &amp; Zusatzkomponenten
        </h2>
        <FormGrid>
          <Field label="Batteriespeicher" htmlFor="storageComponentId">
            <ComponentSelect
              id="storageComponentId"
              name="storageComponentId"
              components={components.SPEICHER ?? []}
              defaultValue={pvData.storageComponentId}
              placeholder="– kein Speicher –"
            />
          </Field>
          <Field label="Wallbox" htmlFor="wallboxComponentId">
            <ComponentSelect
              id="wallboxComponentId"
              name="wallboxComponentId"
              components={components.WALLBOX ?? []}
              defaultValue={pvData.wallboxComponentId}
              placeholder="– keine Wallbox –"
            />
          </Field>
          <Field label="Energiemanagement" htmlFor="emsComponentId">
            <ComponentSelect
              id="emsComponentId"
              name="emsComponentId"
              components={components.ENERGIEMANAGER ?? []}
              defaultValue={pvData.emsComponentId}
              placeholder="– kein Energiemanager –"
            />
          </Field>
          <Field label="Montagesystem" htmlFor="mountingSystemComponentId">
            <ComponentSelect
              id="mountingSystemComponentId"
              name="mountingSystemComponentId"
              components={components.MONTAGESYSTEM ?? []}
              defaultValue={pvData.mountingSystemComponentId}
              placeholder="– Montagesystem wählen –"
            />
          </Field>
        </FormGrid>
      </div>

      <WizardActions backHref={backHref} nextLabel="Berechnen" />
    </form>
  );
}
