// Vereinfachte Faustformel-Werte für die Vertriebs-Kalkulation.
// Kein Ersatz für eine normkonforme Auslegung (DIN EN 12831 / VDI 4645).

export const PV = {
  baseSpecificYieldKwhPerKwp: 1000,
  electricityPriceEurPerKwh: 0.32,
  feedInTariffEurPerKwh: 0.08,
  co2FactorKgPerKwh: 0.4,
  orientationFactor: {
    S: 1.0,
    SO: 0.95,
    SW: 0.95,
    O: 0.85,
    W: 0.85,
    NO: 0.7,
    NW: 0.7,
    N: 0.6,
  } as Record<string, number>,
  shadingFactor: {
    KEINE: 1.0,
    LEICHT: 0.93,
    MITTEL: 0.83,
    STARK: 0.65,
  } as Record<string, number>,
};

export const HEAT_PUMP = {
  specificHeatLoadWPerSqm: {
    UNSANIERT: 100,
    TEILSANIERT: 70,
    SANIERT: 50,
    NEUBAU: 35,
  } as Record<string, number>,
  defaultSpecificHeatLoadWPerSqm: 65,
  fullLoadHours: 1800,
  defaultJazByEmitter: {
    FUSSBODENHEIZUNG: 4.0,
    HEIZKOERPER: 3.2,
    MISCHSYSTEM: 3.6,
  } as Record<string, number>,
  defaultJaz: 3.5,
  heatPumpElectricityPriceEurPerKwh: 0.28,
  co2FactorGridKgPerKwh: 0.4,
  oldHeatingCost: {
    OEL: { pricePerUnit: 1.05, co2KgPerUnit: 2.65 }, // €/l, kg CO2/l
    GAS: { pricePerUnit: 1.0, co2KgPerUnit: 2.0 }, // €/m³, kg CO2/m³ (≈10 kWh/m³)
    ELEKTRO: { pricePerUnit: 0.32, co2KgPerUnit: 0.4 }, // €/kWh, kg CO2/kWh
    PELLET: { pricePerUnit: 0.32, co2KgPerUnit: 0.03 }, // €/kg, kg CO2/kg
  } as Record<string, { pricePerUnit: number; co2KgPerUnit: number }>,
};
