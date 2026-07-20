"use client";

import { useActionState } from "react";
import { Field, FormGrid, TextInput, Select, Textarea } from "@/components/form";
import { Button } from "@/components/ui";
import { BUILDING_TYPES } from "@/lib/options";
import { createCustomerAction, type CustomerFormState } from "./actions";

export function CustomerForm() {
  const [state, formAction, isPending] = useActionState<
    CustomerFormState,
    FormData
  >(createCustomerAction, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-sm font-semibold text-slate-500">Kontaktdaten</h2>
        <FormGrid>
          <Field label="Anrede" htmlFor="salutation">
            <Select id="salutation" name="salutation" defaultValue="">
              <option value="">– Bitte wählen –</option>
              <option value="Herr">Herr</option>
              <option value="Frau">Frau</option>
              <option value="Firma">Firma</option>
            </Select>
          </Field>
          <Field label="Firma (optional)" htmlFor="company">
            <TextInput id="company" name="company" />
          </Field>
          <Field label="Vorname" htmlFor="firstName">
            <TextInput id="firstName" name="firstName" required autoFocus />
          </Field>
          <Field label="Nachname" htmlFor="lastName">
            <TextInput id="lastName" name="lastName" required />
          </Field>
          <Field label="Telefon" htmlFor="phone">
            <TextInput id="phone" name="phone" type="tel" />
          </Field>
          <Field label="E-Mail" htmlFor="email">
            <TextInput id="email" name="email" type="email" />
          </Field>
          <Field label="Ansprechpartner (optional)" htmlFor="contactPerson" full>
            <TextInput id="contactPerson" name="contactPerson" />
          </Field>
        </FormGrid>
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-sm font-semibold text-slate-500">Adresse &amp; Gebäude</h2>
        <FormGrid>
          <Field label="Straße &amp; Hausnummer" htmlFor="street" full>
            <TextInput id="street" name="street" />
          </Field>
          <Field label="PLZ" htmlFor="postalCode">
            <TextInput id="postalCode" name="postalCode" inputMode="numeric" />
          </Field>
          <Field label="Ort" htmlFor="city">
            <TextInput id="city" name="city" />
          </Field>
          <Field label="Gebäudetyp" htmlFor="buildingType">
            <Select id="buildingType" name="buildingType" defaultValue="">
              <option value="">– Bitte wählen –</option>
              {BUILDING_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Baujahr" htmlFor="buildYear">
            <TextInput id="buildYear" name="buildYear" type="number" inputMode="numeric" />
          </Field>
        </FormGrid>
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-sm font-semibold text-slate-500">Notizen</h2>
        <Textarea name="notes" placeholder="Interne Notizen zum Kunden…" />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Speichern…" : "Kunde anlegen"}
      </Button>
    </form>
  );
}
