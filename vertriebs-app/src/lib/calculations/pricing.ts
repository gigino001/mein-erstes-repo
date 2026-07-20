export type PricingInput = {
  totalCost: number;
  marginPercent: number;
  discountAmount: number;
  financingMonths?: number | null;
  financingInterestPercent?: number | null;
};

export type PricingResult = {
  totalCost: number;
  salesPrice: number;
  monthlyRate: number | null;
};

export function calculatePricing(input: PricingInput): PricingResult {
  const salesPrice = Math.max(
    input.totalCost * (1 + input.marginPercent / 100) - input.discountAmount,
    0
  );

  let monthlyRate: number | null = null;
  if (input.financingMonths && input.financingMonths > 0) {
    const monthlyInterest = (input.financingInterestPercent ?? 0) / 100 / 12;
    if (monthlyInterest > 0) {
      monthlyRate =
        (salesPrice * monthlyInterest) /
        (1 - Math.pow(1 + monthlyInterest, -input.financingMonths));
    } else {
      monthlyRate = salesPrice / input.financingMonths;
    }
  }

  return {
    totalCost: round(input.totalCost, 2),
    salesPrice: round(salesPrice, 2),
    monthlyRate: monthlyRate != null ? round(monthlyRate, 2) : null,
  };
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
