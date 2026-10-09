import { describe, expect, it } from "vitest";
import { computeLayout } from "../src";
import planes from "../../../spikes/s2-lod2/fixtures/lod2-planes.json";

/**
 * Echte Dachflächen aus dem NRW-3D-Gebäudemodell (LoD2, Bielefeld, UTM-Koordinaten).
 * Die Schrägfläche des Kerns (Grundriss / cos Neigung) wird gegen die unabhängig aus den 3D-Punkten
 * berechnete Fläche (Newell-Verfahren im Parser) verglichen.
 */
describe("LoD2-Dachflächen aus NRW", () => {
  it("Fixture enthält Flächen", () => {
    expect(planes.length).toBeGreaterThan(20);
  });

  for (const p of planes) {
    const name = `${p.building} ${p.roofType} ${p.slopeDeg}°/${p.azimuthDeg}° ${p.areaM2} m²`;
    it(`Schrägfläche stimmt mit den 3D-Daten überein: ${name}`, () => {
      const res = computeLayout({
        outline: p.ring.map(([x, y]) => ({ x: x!, y: y! })),
        slopeDeg: p.slopeDeg,
        azimuthDeg: p.azimuthDeg,
      });
      expect(res.grossAreaM2).toBeGreaterThan(0);
      expect(Math.abs(res.grossAreaM2 - p.areaM2) / p.areaM2).toBeLessThan(0.005);
      expect(res.moduleAreaM2).toBeLessThanOrEqual(res.usableAreaM2 + 1e-6);
    });
  }
});
