import { Check, Trash2 } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { Field, FormGrid, TextInput } from "@/components/form";
import { AddCostItemForm } from "./add-cost-item-form";
import { FinancingRateField } from "./financing-rate-field";
import type { Component, CostItem, FinancingRate, Pricing } from "@/generated/prisma/client";
import {
  addCostItemAction,
  deleteCostItemAction,
  updateCostItemDiscountAction,
  updatePricingAction,
} from "./actions";

const CATEGORY_LABELS: Record<string, string> = {
  MATERIAL: "Material",
  MONTAGE: "Montage",
  SONSTIGES: "Sonstiges",
};

function formatEur(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

type CostItemWithComponent = CostItem & { component: Component | null };

export function CostSection({
  projectId,
  costItems,
  components,
  financingRates,
  pricing,
}: {
  projectId: string;
  costItems: CostItemWithComponent[];
  components: Component[];
  financingRates: FinancingRate[];
  pricing: Pricing;
}) {
  const totalCost = costItems.reduce((sum, item) => sum + item.amount, 0);
  const byCategory = ["MATERIAL", "MONTAGE", "SONSTIGES"].map((category) => ({
    category,
    items: costItems.filter((item) => item.category === category),
  }));

  const boundAdd = addCostItemAction.bind(null, projectId);
  const boundUpdatePricing = updatePricingAction.bind(null, projectId);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-500">
          Kostenpositionen
        </h2>

        {byCategory.map((group) => (
          <div key={group.category} className="mb-4 last:mb-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {CATEGORY_LABELS[group.category]}
            </p>
            {group.items.length === 0 ? (
              <p className="text-sm text-slate-400">Keine Positionen</p>
            ) : (
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      {item.description}
                      {item.sourceVariant && (
                        <span className="ml-2 text-xs text-slate-400">
                          (aus Konfiguration)
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      {item.component && (
                        <form
                          action={updateCostItemDiscountAction.bind(
                            null,
                            projectId,
                            item.id
                          )}
                          className="flex items-center gap-1"
                        >
                          <input
                            type="number"
                            name="discountPercent"
                            defaultValue={item.discountPercent}
                            step="0.1"
                            min="0"
                            max="100"
                            className="w-16 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs"
                            aria-label="Rabatt in %"
                          />
                          <span className="text-xs text-slate-400">
                            % Rabatt
                            {item.component.maxDiscountPercent != null &&
                              ` (max. ${item.component.maxDiscountPercent})`}
                          </span>
                          <button
                            type="submit"
                            className="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                            aria-label="Rabatt übernehmen"
                          >
                            <Check size={13} />
                          </button>
                        </form>
                      )}
                      <span className="font-medium">{formatEur(item.amount)}</span>
                      <form
                        action={deleteCostItemAction.bind(null, projectId, item.id)}
                      >
                        <button
                          type="submit"
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Position löschen"
                        >
                          <Trash2 size={13} />
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <AddCostItemForm components={components} action={boundAdd} />

        <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm font-semibold">
          <span>Gesamtkosten</span>
          <span>{formatEur(totalCost)}</span>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-500">
          Preisfindung
        </h2>
        <form action={boundUpdatePricing} className="space-y-4">
          <FormGrid>
            <Field label="Marge (%)" htmlFor="marginPercent">
              <TextInput
                id="marginPercent"
                name="marginPercent"
                type="number"
                step="0.1"
                defaultValue={pricing.marginPercent}
              />
            </Field>
            <Field label="Rabatt (€)" htmlFor="discountAmount">
              <TextInput
                id="discountAmount"
                name="discountAmount"
                type="number"
                step="0.01"
                defaultValue={pricing.discountAmount}
              />
            </Field>
            <Field label="Finanzierung (Monate)" htmlFor="financingMonths">
              <TextInput
                id="financingMonths"
                name="financingMonths"
                type="number"
                defaultValue={pricing.financingMonths ?? ""}
              />
            </Field>
            <FinancingRateField
              rates={financingRates}
              defaultValue={pricing.financingInterestPercent}
            />
          </FormGrid>
          <Button type="submit" variant="secondary">
            Preis neu berechnen
          </Button>
        </form>

        <div className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Gesamtkosten</span>
            <span>{formatEur(pricing.totalCost)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Verkaufspreis</span>
            <span className="text-emerald-600">{formatEur(pricing.salesPrice)}</span>
          </div>
          {pricing.monthlyRate != null && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Monatsrate</span>
              <span>{formatEur(pricing.monthlyRate)}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
