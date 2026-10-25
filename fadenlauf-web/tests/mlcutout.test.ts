import { describe, expect, it } from "vitest";
import { applyThreshold, maskLooksOk, maskStats } from "../src/lib/mlCutout";

const mask = (w: number, h: number, fn: (x: number, y: number) => number) => { const m = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = fn(x, y); return m; };

describe("KI-Maske", () => {
  it("nimmt ein zusammenhängendes Kleidungsstück an", () => {
    const m = mask(100, 100, (x, y) => (x > 25 && x < 75 && y > 10 && y < 90 ? 255 : 0));
    const s = maskStats(m, 100, 100); expect(maskLooksOk(s)).toBe(true); expect(s.box).toEqual([26, 11, 74, 89]);
  });
  it("verwirft leere und vollflächige Masken", () => {
    expect(maskLooksOk(maskStats(mask(100, 100, () => 0), 100, 100))).toBe(false);
    expect(maskLooksOk(maskStats(mask(100, 100, () => 255), 100, 100))).toBe(false);
  });
  it("verwirft winzige oder zerfetzte Masken", () => {
    expect(maskLooksOk(maskStats(mask(100, 100, (x, y) => (x < 10 && y < 10 ? 255 : 0)), 100, 100))).toBe(false);
    // dünne, weit verstreute Linien: wenig Füllung im Umgebungsrechteck
    expect(maskLooksOk(maskStats(mask(100, 100, (x, y) => (x === 5 || x === 95 || y === 5 || y === 95 ? 255 : 0)), 100, 100))).toBe(false);
  });
  it("Schwelle: gröber entfernt mehr Halbtransparentes", () => {
    const soft = new Uint8Array([60, 110, 130, 200, 255]);
    const fine = applyThreshold(soft, 0.6), coarse = applyThreshold(soft, 1.8);
    expect(coarse[2]).toBeLessThanOrEqual(fine[2]); expect(coarse[4]).toBe(255);
    expect(fine[0]).toBeGreaterThan(0); expect(coarse[0]).toBe(0); // schwacher Rest bleibt bei „fein“ sichtbar, bei „grob“ nicht
  });
});
