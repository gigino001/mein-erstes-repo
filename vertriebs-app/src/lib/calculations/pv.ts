import { PV } from "./constants";

export type RoofSurfaceInput = {
  orientation?: string | null;
  tiltDegrees?: number | null;
  usableAreaSqm?: number | null;
  shading?: string | null;
};

function tiltFactor(tiltDegrees: number | null | undefined): number {
  if (tiltDegrees == null) return 1.0;
  if (tiltDegrees <= 5) return 0.9;
  if (tiltDegrees <= 20) return 0.95;
  if (tiltDegrees <= 40) return 1.0;
  if (tiltDegrees <= 60) return 0.95;
  return 0.85;
}

/** Gewichteter Ertragsfaktor (0-1) über alle Dachflächen, gewichtet nach nutzbarer Fläche. */
export function weightedYieldFactor(roofSurfaces: RoofSurfaceInput[]): number {
  const withArea = roofSurfaces.filter((r) => (r.usableAreaSqm ?? 0) > 0);
  if (withArea.length === 0) return 1.0;

  let weightedSum = 0;
  let totalArea = 0;
  for (const surface of withArea) {
    const area = surface.usableAreaSqm ?? 0;
    const orientationF = surface.orientation
      ? (PV.orientationFactor[surface.orientation] ?? 1.0)
      : 1.0;
    const shadingF = surface.shading ? (PV.shadingFactor[surface.shading] ?? 1.0) : 1.0;
    const factor = orientationF * tiltFactor(surface.tiltDegrees) * shadingF;
    weightedSum += factor * area;
    totalArea += area;
  }
  return totalArea > 0 ? weightedSum / totalArea : 1.0;
}

export type PvCalculationInput = {
  modulePowerWp: number;
  moduleCount: number;
  roofSurfaces: RoofSurfaceInput[];
  annualConsumptionKwh: number;
  hasStorage: boolean;
};

export type PvCalculationResult = {
  kwp: number;
  annualYieldKwh: number;
  selfConsumptionKwh: number;
  autarkyPercent: number;
  feedInKwh: number;
  feedInRevenueEur: number;
  savingsPerYearEur: number;
  co2SavingsKgPerYear: number;
};

export function calculatePv(input: PvCalculationInput): PvCalculationResult {
  const kwp = (input.modulePowerWp * input.moduleCount) / 1000;
  const yieldFactor = weightedYieldFactor(input.roofSurfaces);
  const annualYieldKwh = kwp * PV.baseSpecificYieldKwhPerKwp * yieldFactor;

  const demandRatio =
    input.annualConsumptionKwh > 0 && annualYieldKwh > 0
      ? Math.min(input.annualConsumptionKwh / annualYieldKwh, 1.5)
      : 0;

  let selfConsumptionRatio = 0.3 + 0.2 * demandRatio;
  if (input.hasStorage) selfConsumptionRatio += 0.25;
  selfConsumptionRatio = Math.min(Math.max(selfConsumptionRatio, 0.15), 0.85);

  let selfConsumptionKwh = annualYieldKwh * selfConsumptionRatio;
  if (input.annualConsumptionKwh > 0) {
    selfConsumptionKwh = Math.min(selfConsumptionKwh, input.annualConsumptionKwh);
  } else {
    selfConsumptionKwh = 0;
  }

  const autarkyPercent =
    input.annualConsumptionKwh > 0
      ? Math.min((selfConsumptionKwh / input.annualConsumptionKwh) * 100, 100)
      : 0;

  const feedInKwh = Math.max(annualYieldKwh - selfConsumptionKwh, 0);
  const feedInRevenueEur = feedInKwh * PV.feedInTariffEurPerKwh;
  const savingsPerYearEur =
    selfConsumptionKwh * PV.electricityPriceEurPerKwh + feedInRevenueEur;
  const co2SavingsKgPerYear = annualYieldKwh * PV.co2FactorKgPerKwh;

  return {
    kwp: round(kwp, 2),
    annualYieldKwh: round(annualYieldKwh, 0),
    selfConsumptionKwh: round(selfConsumptionKwh, 0),
    autarkyPercent: round(autarkyPercent, 1),
    feedInKwh: round(feedInKwh, 0),
    feedInRevenueEur: round(feedInRevenueEur, 2),
    savingsPerYearEur: round(savingsPerYearEur, 2),
    co2SavingsKgPerYear: round(co2SavingsKgPerYear, 0),
  };
}

export function amortizationYears(investmentCostEur: number, savingsPerYearEur: number) {
  if (savingsPerYearEur <= 0) return null;
  return round(investmentCostEur / savingsPerYearEur, 1);
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
