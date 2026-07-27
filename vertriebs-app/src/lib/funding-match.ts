import type { Customer, FundingProgram } from "@/generated/prisma/client";

export type FundingMatchInput = {
  customer: Pick<Customer, "usageType" | "annualHouseholdIncomeEur">;
  variantType: string;
  isNewBuilding: boolean;
};

/**
 * Einfache, nachvollziehbare Vorprüfung: filtert Förderprogramme anhand der
 * strukturiert erfassten Bedingungen. Alle übrigen Bedingungen bleiben als
 * Freitext (program.conditions) zur manuellen Prüfung sichtbar – keine
 * verbindliche Förderzusage.
 */
export function matchFundingPrograms(
  programs: FundingProgram[],
  input: FundingMatchInput
): FundingProgram[] {
  return programs.filter((program) => {
    if (!program.active) return false;

    if (program.appliesTo !== "BEIDE" && program.appliesTo !== input.variantType) {
      return false;
    }

    if (program.requiresExistingBuilding && input.isNewBuilding) {
      return false;
    }

    if (program.requiresOwnerOccupied && input.customer.usageType !== "SELBSTGENUTZT") {
      return false;
    }

    if (
      program.maxHouseholdIncomeEur != null &&
      input.customer.annualHouseholdIncomeEur != null &&
      input.customer.annualHouseholdIncomeEur > program.maxHouseholdIncomeEur
    ) {
      return false;
    }

    return true;
  });
}
