"use client";

import { useState } from "react";
import { Field, FormGrid, TextInput, Select } from "@/components/form";
import { Button } from "@/components/ui";
import { COMPONENT_CATEGORIES } from "@/lib/options";
import type { Component } from "@/generated/prisma/client";

export function AddCostItemForm({
  components,
  action,
}: {
  components: Component[];
  action: (formData: FormData) => void;
}) {
  const [componentId, setComponentId] = useState("");
  const selected = components.find((c) => c.id === componentId) ?? null;

  const byCategory = COMPONENT_CATEGORIES.map((cat) => ({
    ...cat,
    items: components.filter((c) => c.category === cat.value),
  })).filter((group) => group.items.length > 0);

  return (
    <form action={action} className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
      <Field label="Komponente (optional)" htmlFor="componentId">
        <Select
          id="componentId"
          name="componentId"
          value={componentId}
          onChange={(e) => setComponentId(e.target.value)}
        >
          <option value="">– Freitext-Position –</option>
          {byCategory.map((group) => (
            <optgroup key={group.value} label={group.label}>
              {group.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.manufacturer} {c.name} – {c.price.toLocaleString("de-DE")} €
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Field>

      {selected ? (
        <FormGrid>
          <Field label="Menge" htmlFor="quantity">
            <TextInput
              key={`qty-${selected.id}`}
              id="quantity"
              name="quantity"
              type="number"
              step="0.01"
              defaultValue="1"
            />
          </Field>
          <Field
            label="Rabatt (%)"
            htmlFor="discountPercent"
            hint={
              selected.maxDiscountPercent != null
                ? `Max. ${selected.maxDiscountPercent}%`
                : undefined
            }
          >
            <TextInput
              key={`disc-${selected.id}`}
              id="discountPercent"
              name="discountPercent"
              type="number"
              step="0.1"
              defaultValue="0"
            />
          </Field>
          <Field label="Beschreibung" htmlFor="description" full>
            <TextInput
              key={`desc-${selected.id}`}
              id="description"
              name="description"
              defaultValue={`${selected.manufacturer} ${selected.name}`}
              required
            />
          </Field>
        </FormGrid>
      ) : (
        <FormGrid>
          <Field label="Kategorie" htmlFor="category">
            <Select id="category" name="category" defaultValue="MATERIAL">
              <option value="MATERIAL">Material</option>
              <option value="MONTAGE">Montage</option>
              <option value="SONSTIGES">Sonstiges</option>
            </Select>
          </Field>
          <Field label="Betrag (€)" htmlFor="amount">
            <TextInput
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              required
            />
          </Field>
          <Field label="Beschreibung" htmlFor="description" full>
            <TextInput id="description" name="description" required />
          </Field>
        </FormGrid>
      )}

      <Button type="submit" variant="secondary">
        + Position hinzufügen
      </Button>
    </form>
  );
}
