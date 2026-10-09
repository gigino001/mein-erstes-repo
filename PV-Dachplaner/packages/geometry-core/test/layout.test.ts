import { describe, expect, it } from "vitest";
import { computeLayout, type RoofPlaneInput } from "../src";
import { polyArea, rect, rotate } from "./helpers";

const COS35 = Math.cos((35 * Math.PI) / 180);

/** Süd-Dach: fällt nach Süden (180°) ab; Traufe unten (y=0), First oben (y=depth). */
const saddleSouth = (w = 10, depth = 5, slope = 35): RoofPlaneInput => ({
  outline: rect(0, 0, w, depth),
  slopeDeg: slope,
  azimuthDeg: 180,
});

describe("Schrägfläche und Rechenbeispiel aus PLAN.md 6.4", () => {
  const r = computeLayout(saddleSouth());

  it("Schrägfläche = Grundriss / cos(Neigung)", () => {
    expect(r.grossAreaM2).toBeCloseTo(50 / COS35, 2);
    expect(r.grossAreaM2).toBeCloseTo(61.04, 2);
  });
  it("24 Module hochkant, 11,04 kWp", () => {
    expect(r.orientation).toBe("hochkant");
    expect(r.moduleCount).toBe(24);
    expect(r.powerKWp).toBeCloseTo(11.04, 2);
    expect(r.moduleAreaM2).toBeCloseTo(24 * 1.15 * 1.78, 2);
  });
  it("quer passt hier 25 Module (Hinweis auf bessere Ausrichtung)", () => {
    const quer = r.alternatives.find((a) => a.orientation === "quer")!;
    expect(quer.count).toBe(25);
    expect(computeLayout(saddleSouth(), [], { orientation: "beste" }).moduleCount).toBe(25);
  });
  it("Randabstand 20 cm und 10 cm ergeben weiterhin 24 Module", () => {
    expect(computeLayout(saddleSouth(), [], { edgeMarginM: 0.2 }).moduleCount).toBe(24);
    expect(computeLayout(saddleSouth(), [], { edgeMarginM: 0.1 }).moduleCount).toBe(24);
  });
  it("Randabstand: Verlustfläche = Rechteck minus verkleinertes Rechteck (scharfe Ecken)", () => {
    const m = computeLayout(saddleSouth(), [], { edgeMarginM: 0.2 });
    const depthPlane = 5 / COS35;
    const expectedInset = (10 - 0.4) * (depthPlane - 0.4);
    expect(m.usableAreaM2).toBeCloseTo(expectedInset, 2);
    expect(m.marginLossM2).toBeCloseTo(10 * depthPlane - expectedInset, 2);
  });
  it("kleine Dachfläche: Rand lässt kein Modul zu", () => {
    const tight: RoofPlaneInput = { outline: rect(0, 0, 1.4, 3), slopeDeg: 0, azimuthDeg: 180 };
    expect(computeLayout(tight, [], { edgeMarginM: 0.2 }).moduleCount).toBe(0);
    expect(computeLayout(tight).moduleCount).toBe(1);
  });
});

describe("Hindernisse", () => {
  const roof = saddleSouth();
  const chimney = { outline: rect(4.5, 2, 1, 1) };

  it("Fläche wird in der Dachebene abgezogen (Faktor 1/cos)", () => {
    const r = computeLayout(roof, [chimney]);
    expect(r.obstacleLossM2).toBeCloseTo(1 / COS35, 2);
    expect(r.usableAreaM2).toBeCloseTo((50 - 1) / COS35, 2);
  });
  it("Module überdecken das Hindernis nie", () => {
    const r = computeLayout(roof, [chimney]);
    expect(r.moduleCount).toBeLessThan(24);
    expect(r.moduleCount).toBeGreaterThan(14);
    for (const m of r.modules) {
      const hitX = m.corners.some((c) => c.x > 4.5 + 1e-9 && c.x < 5.5 - 1e-9);
      const hitY = m.corners.some((c) => c.y > 2 + 1e-9 && c.y < 3 - 1e-9);
      const inside = hitX && hitY;
      expect(inside).toBe(false);
    }
  });
  it("überlappende Hindernisse werden nicht doppelt gezählt", () => {
    const a = { outline: rect(2, 1, 2, 2) };
    const b = { outline: rect(3, 2, 2, 2) };
    const r = computeLayout(roof, [a, b]);
    expect(r.obstacleLossM2).toBeCloseTo((4 + 4 - 1) / COS35, 2);
  });
  it("Hindernis außerhalb ändert nichts", () => {
    const base = computeLayout(roof);
    const r = computeLayout(roof, [{ outline: rect(20, 20, 1, 1) }]);
    expect(r.obstacleLossM2).toBe(0);
    expect(r.moduleCount).toBe(base.moduleCount);
  });
  it("Hindernis nur zur Information wird nicht abgezogen", () => {
    const r = computeLayout(roof, [{ ...chimney, subtract: false }]);
    expect(r.obstacleLossM2).toBe(0);
    expect(r.moduleCount).toBe(24);
  });
  it("Pufferabstand vergrößert den Abzug", () => {
    const plain = computeLayout(roof, [chimney]);
    const buffered = computeLayout(roof, [{ ...chimney, bufferM: 0.3 }]);
    expect(buffered.obstacleLossM2).toBeGreaterThan(plain.obstacleLossM2);
    expect(buffered.moduleCount).toBeLessThanOrEqual(plain.moduleCount);
  });
  it("Hindernis am Rand wird nicht doppelt mit dem Randabstand gezählt", () => {
    const r = computeLayout(roof, [{ outline: rect(-1, -1, 3, 1.1) }], { edgeMarginM: 0.2 });
    expect(r.marginLossM2 + r.obstacleLossM2 + r.usableAreaM2).toBeCloseTo(r.grossAreaM2, 2);
  });
});

describe("Formen und Randfälle", () => {
  it("Neigung 0° rechnet ohne Faktor", () => {
    const r = computeLayout({ outline: rect(0, 0, 10, 5), slopeDeg: 0, azimuthDeg: 180 });
    expect(r.grossAreaM2).toBeCloseTo(50, 9);
  });
  it("Neigung 90° oder negativ wird abgelehnt", () => {
    expect(() => computeLayout({ outline: rect(0, 0, 1, 1), slopeDeg: 90, azimuthDeg: 0 })).toThrow(RangeError);
    expect(() => computeLayout({ outline: rect(0, 0, 1, 1), slopeDeg: -1, azimuthDeg: 0 })).toThrow(RangeError);
    expect(() => computeLayout({ outline: rect(0, 0, 1, 1), slopeDeg: NaN, azimuthDeg: 0 })).toThrow(RangeError);
  });
  it("zu wenige Punkte werden abgelehnt", () => {
    expect(() => computeLayout({ outline: [{ x: 0, y: 0 }, { x: 1, y: 1 }], slopeDeg: 30, azimuthDeg: 0 })).toThrow(RangeError);
  });
  it("winzige Fläche: 0 Module, kein Fehler", () => {
    const r = computeLayout({ outline: rect(0, 0, 0.5, 0.5), slopeDeg: 30, azimuthDeg: 90 });
    expect(r.moduleCount).toBe(0);
    expect(r.modules).toEqual([]);
  });
  it("Dreieck (Walm-Seite): Module liegen vollständig innen und überlappen nicht", () => {
    const tri = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 5 }];
    const r = computeLayout({ outline: tri, slopeDeg: 30, azimuthDeg: 180 });
    expect(r.moduleCount).toBeGreaterThan(5);
    for (const m of r.modules) {
      for (const c of m.corners) {
        // innerhalb des Dreiecks (Kantenfunktionen)
        expect(c.y).toBeGreaterThanOrEqual(-1e-6);
        expect(c.y).toBeLessThanOrEqual(c.x + 1e-6);
        expect(c.y).toBeLessThanOrEqual(10 - c.x + 1e-6);
      }
    }
    expectNoOverlap(r.modules);
  });
  it("L-förmiges Dach funktioniert", () => {
    const L = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 8 }, { x: 0, y: 8 }];
    const r = computeLayout({ outline: L, slopeDeg: 25, azimuthDeg: 180 });
    expect(r.grossAreaM2).toBeCloseTo(polyArea(L) / Math.cos((25 * Math.PI) / 180), 2);
    expect(r.moduleCount).toBeGreaterThan(10);
    expectNoOverlap(r.modules);
  });
  it("selbstüberschneidender Umriss wird aufgelöst und stürzt nicht ab", () => {
    const bow = [{ x: 0, y: 0 }, { x: 4, y: 4 }, { x: 4, y: 0 }, { x: 0, y: 4 }];
    expect(() => computeLayout({ outline: bow, slopeDeg: 20, azimuthDeg: 180 })).not.toThrow();
  });
  it("Fuge zwischen den Modulen verringert die Anzahl", () => {
    const base = computeLayout(saddleSouth(10, 5, 0)).moduleCount;
    const gapped = computeLayout(saddleSouth(10, 5, 0), [], { gapM: 0.3 }).moduleCount;
    expect(gapped).toBeLessThanOrEqual(base);
  });
});

describe("Drehinvarianz (Eigenschaftstest)", () => {
  it("gleiche Anzahl und Fläche, wenn Umriss und Ausrichtung gemeinsam gedreht werden", () => {
    const base = computeLayout({ outline: rect(0, 0, 9, 6), slopeDeg: 32, azimuthDeg: 180 }, [{ outline: rect(3, 2, 1, 1) }], {
      edgeMarginM: 0.2,
    });
    for (const deg of [15, 47, 90, 133, 200, 311]) {
      const rotated = computeLayout(
        { outline: rotate(rect(0, 0, 9, 6), deg), slopeDeg: 32, azimuthDeg: (180 - deg + 720) % 360 },
        [{ outline: rotate(rect(3, 2, 1, 1), deg) }],
        { edgeMarginM: 0.2 },
      );
      expect(rotated.usableAreaM2).toBeCloseTo(base.usableAreaM2, 2);
      expect(Math.abs(rotated.moduleCount - base.moduleCount)).toBeLessThanOrEqual(0);
    }
  });
});

describe("Qualität der Belegung gegen feine Suche", () => {
  it("grobes Raster liegt höchstens 1 Modul unter der feinen Suche (1 cm)", () => {
    const cases: RoofPlaneInput[] = [
      { outline: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 5 }], slopeDeg: 30, azimuthDeg: 180 },
      { outline: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 7, y: 5 }, { x: 1, y: 5 }], slopeDeg: 38, azimuthDeg: 180 },
      { outline: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 8 }, { x: 0, y: 8 }], slopeDeg: 25, azimuthDeg: 180 },
    ];
    for (const roof of cases) {
      const coarse = computeLayout(roof, [], { stepM: 0.05, orientation: "beste" });
      const fine = computeLayout(roof, [], { stepM: 0.01, orientation: "beste" });
      expect(fine.moduleCount - coarse.moduleCount).toBeLessThanOrEqual(1);
      expect(fine.moduleCount).toBeGreaterThanOrEqual(coarse.moduleCount);
    }
  });
});

describe("Invarianten und Laufzeit", () => {
  it("nutzbare Fläche <= Dachfläche; Modulfläche <= nutzbare Fläche", () => {
    const r = computeLayout(saddleSouth(12, 7, 40), [{ outline: rect(5, 3, 1.2, 0.9) }, { outline: rect(8, 1, 0.8, 0.8) }], {
      edgeMarginM: 0.2,
    });
    expect(r.usableAreaM2).toBeLessThanOrEqual(r.grossAreaM2);
    expect(r.moduleAreaM2).toBeLessThanOrEqual(r.usableAreaM2 + 1e-9);
    expect(r.marginLossM2 + r.obstacleLossM2 + r.usableAreaM2).toBeCloseTo(r.grossAreaM2, 2);
  });
  it("150-m²-Dach mit 5 Hindernissen unter 500 ms (Node)", () => {
    const roof: RoofPlaneInput = { outline: rect(0, 0, 15, 10), slopeDeg: 35, azimuthDeg: 180 };
    const obs = [
      { outline: rect(2, 2, 0.8, 0.8), bufferM: 0.2 },
      { outline: rect(6, 5, 1, 1), bufferM: 0.2 },
      { outline: rect(9, 2, 0.6, 1.2) },
      { outline: rect(11, 6, 1.5, 1.5), bufferM: 0.3 },
      { outline: rect(4, 8, 0.5, 0.5) },
    ];
    const t0 = performance.now();
    const r = computeLayout(roof, obs, { edgeMarginM: 0.2, orientation: "beste" });
    const ms = performance.now() - t0;
    console.log(`Laufzeit 150-m²-Dach: ${ms.toFixed(0)} ms, Module: ${r.moduleCount}`);
    expect(ms, `Laufzeit ${ms.toFixed(0)} ms`).toBeLessThan(500);
  });
});

function expectNoOverlap(mods: { u: number; v: number }[]) {
  // alle Module einer Belegung haben gleiche Größe; Überlappung nur bei Abstand < Kantenlänge in beiden Achsen
  for (let i = 0; i < mods.length; i++) {
    for (let j = i + 1; j < mods.length; j++) {
      const a = mods[i]!;
      const b = mods[j]!;
      const du = Math.abs(a.u - b.u);
      const dv = Math.abs(a.v - b.v);
      const overlap = du < 1.15 - 1e-6 && dv < 1.15 - 1e-6;
      expect(overlap).toBe(false);
    }
  }
}
