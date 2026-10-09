import { computeLayout } from "@pv-dachplaner/geometry-core";

/** Rechenbeispiel aus PLAN.md 6.4: 10 × 5 m Grundriss, 35° Neigung, nach Süden geneigt. */
export function beispielRechnung() {
  const r = computeLayout({
    outline: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
      { x: 0, y: 5 },
    ],
    slopeDeg: 35,
    azimuthDeg: 180,
  });
  return { flaecheM2: r.grossAreaM2, module: r.moduleCount, kWp: r.powerKWp };
}
