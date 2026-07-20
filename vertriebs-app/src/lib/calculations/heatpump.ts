import { HEAT_PUMP } from "./constants";

export type HeatPumpCalculationInput = {
  heatedAreaSqm: number;
  insulationStandard?: string | null;
  heatEmitterType?: string | null;
  jazOverride?: number | null;
  currentHeatingType?: string | null;
  annualConsumptionValue?: number | null;
  annualConsumptionUnit?: string | null;
};

export type HeatPumpCalculationResult = {
  heatLoadKw: number;
  annualHeatDemandKwh: number;
  annualElectricityConsumptionKwh: number;
  jaz: number;
  annualOperatingCostEur: number;
  oldAnnualCostEur: number | null;
  savingsPerYearEur: number | null;
  co2SavingsKgPerYear: number | null;
};

export function calculateHeatPump(
  input: HeatPumpCalculationInput
): HeatPumpCalculationResult {
  const specificLoad = input.insulationStandard
    ? (HEAT_PUMP.specificHeatLoadWPerSqm[input.insulationStandard] ??
      HEAT_PUMP.defaultSpecificHeatLoadWPerSqm)
    : HEAT_PUMP.defaultSpecificHeatLoadWPerSqm;

  const heatLoadKw = (input.heatedAreaSqm * specificLoad) / 1000;
  const annualHeatDemandKwh = heatLoadKw * HEAT_PUMP.fullLoadHours;

  const jaz =
    input.jazOverride ??
    (input.heatEmitterType
      ? (HEAT_PUMP.defaultJazByEmitter[input.heatEmitterType] ?? HEAT_PUMP.defaultJaz)
      : HEAT_PUMP.defaultJaz);

  const annualElectricityConsumptionKwh = annualHeatDemandKwh / jaz;
  const annualOperatingCostEur =
    annualElectricityConsumptionKwh * HEAT_PUMP.heatPumpElectricityPriceEurPerKwh;

  let oldAnnualCostEur: number | null = null;
  let oldCo2KgPerYear: number | null = null;
  if (
    input.currentHeatingType &&
    input.annualConsumptionValue != null &&
    HEAT_PUMP.oldHeatingCost[input.currentHeatingType]
  ) {
    const { pricePerUnit, co2KgPerUnit } = HEAT_PUMP.oldHeatingCost[input.currentHeatingType];
    oldAnnualCostEur = input.annualConsumptionValue * pricePerUnit;
    oldCo2KgPerYear = input.annualConsumptionValue * co2KgPerUnit;
  }

  const newCo2KgPerYear =
    annualElectricityConsumptionKwh * HEAT_PUMP.co2FactorGridKgPerKwh;

  return {
    heatLoadKw: round(heatLoadKw, 1),
    annualHeatDemandKwh: round(annualHeatDemandKwh, 0),
    annualElectricityConsumptionKwh: round(annualElectricityConsumptionKwh, 0),
    jaz: round(jaz, 2),
    annualOperatingCostEur: round(annualOperatingCostEur, 2),
    oldAnnualCostEur: oldAnnualCostEur != null ? round(oldAnnualCostEur, 2) : null,
    savingsPerYearEur:
      oldAnnualCostEur != null ? round(oldAnnualCostEur - annualOperatingCostEur, 2) : null,
    co2SavingsKgPerYear:
      oldCo2KgPerYear != null ? round(oldCo2KgPerYear - newCo2KgPerYear, 0) : null,
  };
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
