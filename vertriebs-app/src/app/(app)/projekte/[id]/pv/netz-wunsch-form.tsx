import { Field, FormGrid, TextInput, Checkbox } from "@/components/form";
import { WizardActions } from "@/components/wizard";
import type { PvData } from "@/generated/prisma/client";

export function NetzWunschForm({
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
        <h2 className="mb-3 text-sm font-semibold text-slate-500">Netz</h2>
        <FormGrid>
          <Field label="Netzbetreiber" htmlFor="gridOperator">
            <TextInput
              id="gridOperator"
              name="gridOperator"
              defaultValue={pvData.gridOperator ?? ""}
            />
          </Field>
          <Field label="Hausanschlussleistung (kW)" htmlFor="gridConnectionPowerKw">
            <TextInput
              id="gridConnectionPowerKw"
              name="gridConnectionPowerKw"
              type="number"
              inputMode="decimal"
              step="0.1"
              defaultValue={pvData.gridConnectionPowerKw ?? ""}
            />
          </Field>
        </FormGrid>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Checkbox
            name="meterCabinetSufficient"
            label="Zählerschrank ausreichend"
            defaultChecked={pvData.meterCabinetSufficient ?? false}
          />
          <Checkbox
            name="threePhase"
            label="Dreiphasiger Anschluss"
            defaultChecked={pvData.threePhase ?? false}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">
          Kundenwunsch
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox
            name="goalMaxSelfSupply"
            label="Maximale Eigenversorgung"
            defaultChecked={pvData.goalMaxSelfSupply}
          />
          <Checkbox
            name="goalMaxYield"
            label="Höchste Rendite"
            defaultChecked={pvData.goalMaxYield}
          />
          <Checkbox
            name="goalBackupPower"
            label="Notstrom"
            defaultChecked={pvData.goalBackupPower}
          />
          <Checkbox
            name="goalEmergencyPower"
            label="Ersatzstrom"
            defaultChecked={pvData.goalEmergencyPower}
          />
          <Checkbox
            name="goalLowCost"
            label="Möglichst günstig"
            defaultChecked={pvData.goalLowCost}
          />
        </div>
      </div>

      <WizardActions backHref={backHref} />
    </form>
  );
}
