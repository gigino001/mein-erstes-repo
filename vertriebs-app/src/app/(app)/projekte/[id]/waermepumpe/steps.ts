import type { WizardStepDef } from "@/components/wizard";

export const WP_STEPS: WizardStepDef[] = [
  { slug: "gebaeude", label: "Gebäude" },
  { slug: "heizung", label: "Heizung" },
  { slug: "heizkoerper", label: "Heizkörper & Warmwasser" },
  { slug: "standort", label: "Standort" },
  { slug: "komponenten", label: "Komponenten" },
  { slug: "ergebnis", label: "Ergebnis" },
];

export const UNIT_BY_HEATING_TYPE: Record<string, string> = {
  OEL: "l",
  GAS: "m³",
  ELEKTRO: "kWh",
  PELLET: "kg",
  FERNWAERME: "kWh",
  SONSTIGE: "kWh",
};
