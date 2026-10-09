import { describe, expect, it } from "vitest";
import { rechne, zahl } from "./berechnung";
import { neuesProjekt, type Project, type RoofPlane } from "./model";

const dach = (extra: Partial<RoofPlane> = {}): RoofPlane => ({
  id: "d1",
  name: "D1",
  outline: [{ x: 466000, y: 5764000 }, { x: 466010, y: 5764000 }, { x: 466010, y: 5764005 }, { x: 466000, y: 5764005 }],
  slopeDeg: 35,
  azimuthDeg: 180,
  quelle: "manuell",
  ...extra,
});
const projekt = (roofs: RoofPlane[], settings: Partial<Project["settings"]> = {}): Project => ({ ...neuesProjekt(), roofs, settings: { randabstandM: 0, orientation: "hochkant", ...settings } });

describe("Berechnung im Projekt (UTM-Koordinaten wie im echten Betrieb)", () => {
  it("Beispiel aus dem Plan: 24 Module, 11,04 kWp, 61,04 m²", () => {
    const g = rechne(projekt([dach()]));
    expect(g.module).toBe(24);
    expect(g.kWp).toBeCloseTo(11.04, 6);
    expect(g.schraegflaecheM2).toBeCloseTo(61.04, 1);
    expect(g.unvollstaendig).toBe(0);
  });
  it("quer ergibt 25 Module, hochkant bleibt in den Alternativen sichtbar", () => {
    const g = rechne(projekt([dach()], { orientation: "quer" }));
    expect(g.module).toBe(25);
    expect(g.daecher[0]?.hochkant).toBe(24);
    expect(g.daecher[0]?.quer).toBe(25);
    expect(rechne(projekt([dach()], { orientation: "beste" })).module).toBe(25);
  });
  it("Randabstand 20 cm: weiterhin 24 Module, nutzbare Fläche kleiner", () => {
    const a = rechne(projekt([dach()]));
    const b = rechne(projekt([dach()], { randabstandM: 0.2 }));
    expect(b.module).toBe(24);
    expect(b.nutzbarM2).toBeLessThan(a.nutzbarM2);
  });
  it("fehlende Angaben ergeben Hinweise statt Zahlen", () => {
    const g = rechne(projekt([dach({ slopeDeg: null }), dach({ id: "d2", name: "D2", azimuthDeg: null }), dach({ id: "d3", name: "D3", slopeDeg: null, azimuthDeg: null })]));
    expect(g.daecher.map((d) => d.status)).toEqual(["neigung", "richtung", "beides"]);
    expect(g.daecher[0]?.hinweise).toEqual(["Neigung fehlt"]);
    expect(g.module).toBe(0);
    expect(g.unvollstaendig).toBe(3);
  });
  it("Summe über mehrere Dachflächen; unvollständige zählen nicht mit", () => {
    const g = rechne(projekt([dach(), dach({ id: "d2", name: "D2" }), dach({ id: "d3", name: "D3", slopeDeg: null })]));
    expect(g.module).toBe(48);
    expect(g.unvollstaendig).toBe(1);
  });
  it("Hindernis reduziert die Module", () => {
    const p = projekt([dach()]);
    p.obstacles = [{ id: "o1", art: "kamin", outline: [{ x: 466004.5, y: 5764002 }, { x: 466005.5, y: 5764002 }, { x: 466005.5, y: 5764003 }, { x: 466004.5, y: 5764003 }], bufferM: 0, abziehen: true }];
    const g = rechne(p);
    expect(g.module).toBeLessThan(24);
    expect(g.daecher[0]?.layout?.obstacleLossM2).toBeCloseTo(1 / Math.cos((35 * Math.PI) / 180), 1);
  });
  it("Zahlenformat mit Komma", () => {
    expect(zahl(61.0387)).toBe("61,0");
    expect(zahl(11.04, 2)).toBe("11,04");
  });
});
