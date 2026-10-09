import { describe, expect, it } from "vitest";
import { kachelName, lngLatToUtm, utmToLngLat } from "./coords";

describe("Koordinatenumrechnung EPSG:25832", () => {
  it("stimmt mit der unabhängigen Rechnung aus Spike S1 überein (Stadionmitte Bielefeld)", () => {
    // 52,0322° N, 8,5167° O  ->  E 466845,0976 m, N 5764729,8379 m (Krüger-Reihe, eigenes Skript in S1)
    const u = lngLatToUtm({ lng: 8.5167, lat: 52.0322 });
    expect(u.e).toBeCloseTo(466845.0976, 2);
    expect(u.n).toBeCloseTo(5764729.8379, 2);
  });
  it("Hin- und Rückumrechnung bleibt unter 1 mm", () => {
    const p = { e: 469535, n: 5763689 };
    const q = lngLatToUtm(utmToLngLat(p));
    expect(Math.abs(q.e - p.e)).toBeLessThan(0.001);
    expect(Math.abs(q.n - p.n)).toBeLessThan(0.001);
  });
  it("Kachelname im 1-km-Raster", () => {
    expect(kachelName({ e: 469535.4, n: 5763689.9 })).toBe("469_5763");
    expect(kachelName({ e: 466845.1, n: 5764729.8 })).toBe("466_5764");
  });
});
