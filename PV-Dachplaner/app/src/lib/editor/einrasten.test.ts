import { describe, expect, it } from "vitest";
import { einrasten, lotfusspunkt } from "./einrasten";

const ecken = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
const kanten: [{ x: number; y: number }, { x: number; y: number }][] = [[{ x: 0, y: 0 }, { x: 10, y: 0 }], [{ x: 10, y: 0 }, { x: 10, y: 10 }]];

describe("Einrasten", () => {
  it("Lotfußpunkt wird auf die Strecke begrenzt", () => {
    expect(lotfusspunkt({ x: 4, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({ x: 4, y: 0 });
    expect(lotfusspunkt({ x: -5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(lotfusspunkt({ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 2 })).toEqual({ x: 2, y: 2 });
  });
  it("Ecken haben Vorrang vor Kanten", () => {
    const r = einrasten({ x: 0.3, y: 0.2 }, ecken, kanten, 0.5);
    expect(r).toEqual({ punkt: { x: 0, y: 0 }, art: "ecke" });
  });
  it("Kante rastet innerhalb von 70 % der Schwelle ein", () => {
    expect(einrasten({ x: 5, y: 0.3 }, ecken, kanten, 0.5)).toEqual({ punkt: { x: 5, y: 0 }, art: "kante" });
    expect(einrasten({ x: 5, y: 0.4 }, ecken, kanten, 0.5)).toBeNull();
  });
  it("kein Treffer außerhalb der Schwelle", () => {
    expect(einrasten({ x: 5, y: 5 }, ecken, kanten, 0.5)).toBeNull();
  });
  it("wählt die nächste Ecke", () => {
    const r = einrasten({ x: 9.8, y: 0.1 }, ecken, kanten, 1);
    expect(r?.punkt).toEqual({ x: 10, y: 0 });
  });
});
