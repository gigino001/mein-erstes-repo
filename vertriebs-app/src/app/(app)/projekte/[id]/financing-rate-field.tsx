"use client";

import { useState } from "react";
import { Field, TextInput, Select } from "@/components/form";
import type { FinancingRate } from "@/generated/prisma/client";

export function FinancingRateField({
  rates,
  defaultValue,
}: {
  rates: FinancingRate[];
  defaultValue: number | null;
}) {
  const [interestRatePercent, setInterestRatePercent] = useState(
    defaultValue?.toString() ?? ""
  );

  return (
    <>
      {rates.length > 0 && (
        <Field label="Bank (optional)" htmlFor="financingRateId">
          <Select
            id="financingRateId"
            name="financingRateId"
            defaultValue=""
            onChange={(e) => {
              const rate = rates.find((r) => r.id === e.target.value);
              if (rate) setInterestRatePercent(rate.interestRatePercent.toString());
            }}
          >
            <option value="">– manuell eingeben –</option>
            {rates.map((r) => (
              <option key={r.id} value={r.id}>
                {r.bankName} – {r.interestRatePercent}% p.a.
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Zinssatz p.a. (%)" htmlFor="financingInterestPercent">
        <TextInput
          id="financingInterestPercent"
          name="financingInterestPercent"
          type="number"
          step="0.01"
          value={interestRatePercent}
          onChange={(e) => setInterestRatePercent(e.target.value)}
        />
      </Field>
    </>
  );
}
