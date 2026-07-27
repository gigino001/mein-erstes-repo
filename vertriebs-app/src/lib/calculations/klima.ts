import { CLIMA } from "./constants";

export type KlimaRoomInput = {
  areaSqm: number;
  shading?: string | null;
  occupantsCount?: number | null;
  hasHeatSources?: boolean;
};

export type KlimaCalculationInput = {
  insulationStandard?: string | null;
  rooms: KlimaRoomInput[];
};

export type KlimaCalculationResult = {
  roomLoadsKw: number[];
  totalCoolingLoadKw: number;
  recommendedUnitsCount: number;
  estimatedAnnualOperatingCostEur: number;
};

export function calculateKlima(input: KlimaCalculationInput): KlimaCalculationResult {
  const baseWPerSqm = input.insulationStandard
    ? (CLIMA.baseCoolingLoadWPerSqm[input.insulationStandard] ??
      CLIMA.defaultCoolingLoadWPerSqm)
    : CLIMA.defaultCoolingLoadWPerSqm;

  const roomLoadsKw = input.rooms.map((room) => {
    const shadingFactor = room.shading
      ? (CLIMA.shadingFactor[room.shading] ?? 1.0)
      : 1.0;

    const roomLoadW =
      room.areaSqm * baseWPerSqm * shadingFactor +
      (room.occupantsCount ?? 0) * CLIMA.occupantLoadW +
      (room.hasHeatSources ? CLIMA.heatSourceLoadW : 0);

    return round(roomLoadW / 1000, 2);
  });

  const sumLoadsKw = roomLoadsKw.reduce((sum, load) => sum + load, 0);
  const simultaneityFactor =
    input.rooms.length > 1 ? CLIMA.simultaneityFactorMultiRoom : 1;
  const totalCoolingLoadKw = sumLoadsKw * simultaneityFactor;

  const estimatedAnnualOperatingCostEur =
    (totalCoolingLoadKw * CLIMA.assumedFullLoadHoursPerYear * CLIMA.electricityPriceEurPerKwh) /
    CLIMA.assumedEer;

  return {
    roomLoadsKw,
    totalCoolingLoadKw: round(totalCoolingLoadKw, 2),
    recommendedUnitsCount: input.rooms.length,
    estimatedAnnualOperatingCostEur: round(estimatedAnnualOperatingCostEur, 2),
  };
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
