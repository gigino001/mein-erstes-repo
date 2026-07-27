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

// Grundlage: 60–70 W/m² im Standardfall, 90–120 W/m² bei hohem solarem Eintrag
// bzw. schlechter Dämmung; 30–40 W pro m³ Rauminhalt als Alternativ-Faustformel.
// Je Person ca. 100 W innere Last (sitzende Tätigkeit).
export const CLIMA = {
  baseCoolingLoadWPerSqm: {
    NEUBAU: 55,
    SANIERT: 65,
    TEILSANIERT: 80,
    UNSANIERT: 100,
  } as Record<string, number>,
  defaultCoolingLoadWPerSqm: 75,
  // Verschattung reduziert die solare Last, keine Verschattung erhöht sie.
  shadingFactor: {
    KEINE: 1.3,
    LEICHT: 1.15,
    MITTEL: 1.0,
    STARK: 0.85,
  } as Record<string, number>,
  occupantLoadW: 100,
  heatSourceLoadW: 400,
  // Bei mehreren Räumen/Inneneinheiten läuft selten alles gleichzeitig auf
  // Volllast – üblicher Ansatz für Multisplit-Anlagen.
  simultaneityFactorMultiRoom: 0.8,
  assumedFullLoadHoursPerYear: 300,
  assumedEer: 3.0,
  electricityPriceEurPerKwh: 0.32,
};
