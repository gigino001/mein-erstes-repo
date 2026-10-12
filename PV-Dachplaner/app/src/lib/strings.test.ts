import { describe, expect, it } from "vitest";
import { reihenfolge, stringFarbe, stringGroessen, stringZusammenfassung, verstringen } from "./strings";
import { rechne } from "./berechnung";
import { neuesProjekt, type RoofPlane } from "./model";

describe("Stringgrößen", () => {
  it("gleich lange Strings: 45 Module bei höchstens 14 ergeben 12, 11, 11, 11", () => {
    expect(stringGroessen(45, 14, true)).toEqual([12, 11, 11, 11]);
    expect(stringGroessen(42, 14, true)).toEqual([14, 14, 14]);
    expect(stringGroessen(13, 14, true)).toEqual([13]);
    expect(stringGroessen(15, 14, true)).toEqual([8, 7]);
  });
  it("volle Strings zuerst, Rest zuletzt", () => {
    expect(stringGroessen(45, 14, false)).toEqual([14, 14, 14, 3]);
    expect(stringGroessen(28, 14, false)).toEqual([14, 14]);
  });
  it("Summe stimmt immer, kein String länger als erlaubt", () => {
    for (let n = 1; n <= 80; n++) {
      for (const l of [1, 5, 10, 14, 20]) {
        for (const gl of [true, false]) {
          const g = stringGroessen(n, l, gl);
          expect(g.reduce((a, b) => a + b, 0)).toBe(n);
          expect(Math.max(...g)).toBeLessThanOrEqual(l);
          if (gl) expect(Math.max(...g) - Math.min(...g)).toBeLessThanOrEqual(1);
        }
      }
    }
  });
  it("ungültige Eingaben ergeben keine Strings", () => {
    expect(stringGroessen(0, 14, true)).toEqual([]);
    expect(stringGroessen(10, 0, true)).toEqual([]);
  });
});

describe("Reihenfolge der Module", () => {
  const raster = (reihen: number, spalten: number) => {
    const m: { u: number; v: number }[] = [];
    for (let r = 0; r < reihen; r++) for (let s = 0; s < spalten; s++) m.push({ u: s * 1.15, v: r * 1.78 });
    return m;
  };
  it("beginnt an der Traufe (größte v) und läuft als Schlangenlinie", () => {
    const m = raster(3, 3); // Index = Reihe * 3 + Spalte; v wächst mit der Reihe, Traufe = Reihe 2
    expect(reihenfolge(m)).toEqual([6, 7, 8, 5, 4, 3, 0, 1, 2]);
  });
  it("aufeinanderfolgende Module liegen nebeneinander oder in der Nachbarreihe", () => {
    const m = raster(4, 5);
    const f = reihenfolge(m);
    for (let i = 1; i < f.length; i++) {
      const a = m[f[i - 1]!]!, b = m[f[i]!]!;
      expect(Math.hypot(a.u - b.u, a.v - b.v)).toBeLessThanOrEqual(1.8);
    }
  });
});

describe("Verstringung im Projekt", () => {
  const dach = (id: string, name: string, x0: number): RoofPlane => ({
    id,
    name,
    outline: [{ x: x0, y: 5764000 }, { x: x0 + 10, y: 5764000 }, { x: x0 + 10, y: 5764005 }, { x: x0, y: 5764005 }].map((p) => ({ x: p.x + 466000, y: p.y })),
    slopeDeg: 35,
    azimuthDeg: 180,
    quelle: "manuell",
  });
  it("jede Dachfläche für sich, durchgehende Nummern, alle Module genau einmal", () => {
    const p = neuesProjekt();
    p.roofs = [dach("a", "D1", 0), dach("b", "D2", 20)];
    const g = rechne(p);
    expect(g.module).toBe(48);
    const plan = verstringen(g, { laenge: 14, gleichLang: true });
    expect(plan.strings.map((s) => s.nr)).toEqual([1, 2, 3, 4]); // je Dachfläche 24 Module = 12 + 12
    expect(plan.strings.map((s) => s.module.length)).toEqual([12, 12, 12, 12]);
    expect(plan.strings.map((s) => s.roofName)).toEqual(["D1", "D1", "D2", "D2"]);
    for (const name of ["D1", "D2"]) {
      const alle = plan.strings.filter((s) => s.roofName === name).flatMap((s) => s.module).sort((a, b) => a - b);
      expect(alle).toEqual(Array.from({ length: 24 }, (_, i) => i));
    }
    expect(plan.laengen).toEqual({ 12: 4 });
    expect(stringZusammenfassung(plan)).toBe("4 Strings: 4 × 12 Module");
    expect(stringFarbe(1)).not.toBe(stringFarbe(2));
    expect(stringFarbe(13)).toBe(stringFarbe(1));
    expect(verstringen(g, { laenge: 0, gleichLang: true }).strings).toEqual([]);
  });
});
