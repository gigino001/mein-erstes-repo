import { Field, FormGrid, TextInput, Textarea, Select, Checkbox } from "@/components/form";
import { Button } from "@/components/ui";
import type { FundingProgram } from "@/generated/prisma/client";

const PROVIDERS = [
  { value: "KFW", label: "KfW" },
  { value: "BAFA", label: "BAFA" },
  { value: "BUND", label: "Bund" },
  { value: "LAND", label: "Land" },
  { value: "KOMMUNE", label: "Kommune" },
  { value: "SONSTIGE", label: "Sonstige" },
] as const;

const APPLIES_TO = [
  { value: "PV", label: "Photovoltaik" },
  { value: "WAERMEPUMPE", label: "Wärmepumpe" },
  { value: "BEIDE", label: "Beide" },
] as const;

const FUNDING_TYPES = [
  { value: "ZUSCHUSS", label: "Zuschuss" },
  { value: "KREDIT", label: "Kredit" },
  { value: "STEUERVORTEIL", label: "Steuervorteil" },
] as const;

export function FundingForm({
  action,
  existing,
}: {
  action: (formData: FormData) => void;
  existing?: FundingProgram;
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <FormGrid>
          <Field label="Name" htmlFor="name" full>
            <TextInput id="name" name="name" required defaultValue={existing?.name ?? ""} />
          </Field>
          <Field label="Anbieter" htmlFor="provider">
            <Select id="provider" name="provider" defaultValue={existing?.provider ?? "KFW"}>
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Gilt für" htmlFor="appliesTo">
            <Select id="appliesTo" name="appliesTo" defaultValue={existing?.appliesTo ?? "PV"}>
              {APPLIES_TO.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Art" htmlFor="fundingType">
            <Select
              id="fundingType"
              name="fundingType"
              defaultValue={existing?.fundingType ?? "ZUSCHUSS"}
            >
              {FUNDING_TYPES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quelle (URL)" htmlFor="sourceUrl">
            <TextInput id="sourceUrl" name="sourceUrl" defaultValue={existing?.sourceUrl ?? ""} />
          </Field>
          <Field label="Kurzbeschreibung" htmlFor="description" full>
            <Textarea
              id="description"
              name="description"
              required
              defaultValue={existing?.description ?? ""}
            />
          </Field>
        </FormGrid>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">
          Fördersatz &amp; automatisch prüfbare Bedingungen
        </h2>
        <FormGrid>
          <Field label="Fördersatz (%)" htmlFor="percentageOfCost">
            <TextInput
              id="percentageOfCost"
              name="percentageOfCost"
              type="number"
              step="0.1"
              defaultValue={existing?.percentageOfCost ?? ""}
            />
          </Field>
          <Field label="Max. Förderbetrag (€)" htmlFor="maxAmountEur">
            <TextInput
              id="maxAmountEur"
              name="maxAmountEur"
              type="number"
              defaultValue={existing?.maxAmountEur ?? ""}
            />
          </Field>
          <Field
            label="Max. Haushaltseinkommen (€)"
            htmlFor="maxHouseholdIncomeEur"
            hint="Für Einkommens-Bonus, leer lassen falls nicht relevant"
          >
            <TextInput
              id="maxHouseholdIncomeEur"
              name="maxHouseholdIncomeEur"
              type="number"
              defaultValue={existing?.maxHouseholdIncomeEur ?? ""}
            />
          </Field>
        </FormGrid>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Checkbox
            name="requiresExistingBuilding"
            label="Nur Bestandsgebäude"
            defaultChecked={existing?.requiresExistingBuilding ?? false}
          />
          <Checkbox
            name="requiresOwnerOccupied"
            label="Nur selbstnutzende Eigentümer"
            defaultChecked={existing?.requiresOwnerOccupied ?? false}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <Field
          label="Übrige Bedingungen"
          htmlFor="conditions"
          hint="Freitext, wird dem Vertrieb zur manuellen Prüfung angezeigt"
        >
          <Textarea
            id="conditions"
            name="conditions"
            rows={4}
            required
            defaultValue={existing?.conditions ?? ""}
          />
        </Field>
      </div>

      <Checkbox
        name="active"
        label="Aktiv (wird in der Vorprüfung berücksichtigt)"
        defaultChecked={existing?.active ?? true}
      />

      <Button type="submit" className="w-full sm:w-auto">
        {existing ? "Speichern" : "Förderprogramm anlegen"}
      </Button>
    </form>
  );
}
