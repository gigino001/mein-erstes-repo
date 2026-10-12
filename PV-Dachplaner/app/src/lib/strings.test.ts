import { describe, expect, it } from "vitest";
import { gruppenText, modulAlternativen, pruefePlan, reihenfolge, restText, stringFarbe, stringZusammenfassung, summe, teiler, verstringen, versuchLaenge, zweiGruppen } from "./strings";
import { rechne } from "./berechnung";
import { neuesProjekt, type RoofPlane } from "./model";

describe("Teilbarkeit: gleich lange Strings", () => {
  it("36 Module bei 12 gehen auf (3 × 12), 34 Module nicht", () => {
    expect(versuchLaenge(36, 12)).toMatchObject({ ok: true, gruppen: [{ laenge: 12, anzahl: 3 }] });
    const v = versuchLaenge(34, 12);
    expect(v.ok).toBe(false);
    expect(v.meldung).toContain("34 Module lassen sich nicht in gleich lange Strings mit 12 Modulen teilen (34 = 2 × 12 + 10)");
  });
  it("34 Module bei 11: ein Modul bleibt übrig, wird abgelehnt", () => {
    const v = versuchLaenge(34, 11);
    expect(v.ok).toBe(false);
    expect(v.meldung).toContain("34 = 3 × 11 + 1");
  });
  it("Teiler im Bereich", () => {
    expect(teiler(36, { min: 8, max: 14 })).toEqual([9, 12]);
    expect(teiler(34, { min: 8, max: 14 })).toEqual([]);
    expect(teiler(34)).toEqual([2, 17, 34]);
    expect(teiler(1)).toEqual([1]);
    expect(teiler(24, { min: 6, max: 8 })).toEqual([6, 8]);
  });
  it("Bereichsprüfung blockiert Längen außerhalb", () => {
    const v = versuchLaenge(36, 18, { min: 8, max: 14 });
    expect(v.ok).toBe(false);
    expect(v.meldung).toContain("außerhalb des zulässigen Bereichs (8 bis 14)");
    expect(versuchLaenge(36, 0).ok).toBe(false);
    expect(versuchLaenge(36, 12.5).ok).toBe(false);
    expect(versuchLaenge(36, 61).ok).toBe(false);
  });
  it("Rest-Erklärung", () => {
    expect(restText(34, 12)).toBe("34 = 2 × 12 + 10");
    expect(restText(36, 12)).toBe("36 = 3 × 12");
    expect(restText(5, 12)).toBe("5 < 12");
  });
  it("jede akzeptierte Eingabe ergibt genau n Module in gleich langen Strings (alle n bis 80)", () => {
    for (let n = 1; n <= 80; n++) {
      for (let l = 1; l <= 30; l++) {
        const v = versuchLaenge(n, l);
        expect(v.ok).toBe(n % l === 0);
        if (v.ok) expect(summe(v.gruppen!)).toBe(n);
      }
    }
  });
});

describe("Alternativen, wenn nichts aufgeht", () => {
  it("34 Module, Bereich 8 bis 14: Aufteilung auf zwei MPPT-Eingänge, jede Gruppe in sich gleich lang", () => {
    const opt = zweiGruppen(34, { min: 8, max: 14 });
    expect(opt.length).toBeGreaterThan(0);
    for (const g of opt) {
      expect(summe(g)).toBe(34);
      expect(g).toHaveLength(2);
      expect(g[0]!.laenge).not.toBe(g[1]!.laenge);
      for (const x of g) {
        expect(x.laenge).toBeGreaterThanOrEqual(8);
        expect(x.laenge).toBeLessThanOrEqual(14);
      }
    }
    expect(opt.map(gruppenText)).toContain("2 × 12 + 1 × 10");
  });
  it("Nahe Modulzahlen: 33 (3 × 11) und 36 (3 × 12) statt 34", () => {
    const alt = modulAlternativen(34, { min: 8, max: 14 });
    expect(alt.find((a) => a.module === 33)).toMatchObject({ laenge: 11, anzahl: 3 });
    expect(alt.find((a) => a.module === 36)).toMatchObject({ laenge: 12, anzahl: 3 });
    expect(alt.every((a) => a.module !== 34)).toBe(true);
  });
});

describe("Plan prüfen", () => {
  it("fehlende und überzählige Module werden benannt", () => {
    expect(pruefePlan(34, [{ laenge: 12, anzahl: 2 }]).meldungen[0]).toContain("10 Module ohne String");
    expect(pruefePlan(34, [{ laenge: 12, anzahl: 3 }]).meldungen[0]).toContain("2 Module mehr eingeplant");
    expect(pruefePlan(36, [{ laenge: 12, anzahl: 3 }])).toEqual({ ok: true, zugeordnet: 36, meldungen: [] });
    expect(pruefePlan(34, [{ laenge: 12, anzahl: 2 }, { laenge: 10, anzahl: 1 }], { min: 8, max: 14 }).ok).toBe(true);
    expect(pruefePlan(36, [{ laenge: 18, anzahl: 2 }], { min: 8, max: 14 }).ok).toBe(false);
  });
});

describe("Reihenfolge der Module", () => {
  const raster = (reihen: number, spalten: number) => {
    const m: { u: number; v: number }[] = [];
    for (let r = 0; r < reihen; r++) for (let s = 0; s < spalten; s++) m.push({ u: s * 1.15, v: r * 1.78 });
    return m;
  };
  it("beginnt an der Traufe (größte v) und läuft als Schlangenlinie", () => {
    expect(reihenfolge(raster(3, 3))).toEqual([6, 7, 8, 5, 4, 3, 0, 1, 2]);
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
  const dach = (id: string, name: string, x0: number, breite = 10): RoofPlane => ({
    id,
    name,
    outline: [{ x: x0, y: 5764000 }, { x: x0 + breite, y: 5764000 }, { x: x0 + breite, y: 5764005 }, { x: x0, y: 5764005 }].map((p) => ({ x: p.x + 466000, y: p.y })),
    slopeDeg: 35,
    azimuthDeg: 180,
    quelle: "manuell",
  });
  it("jede Dachfläche für sich, durchgehende Nummern, alle Module genau einmal", () => {
    const p = neuesProjekt();
    p.roofs = [dach("a", "D1", 0), dach("b", "D2", 20)];
    const g = rechne(p);
    expect(g.module).toBe(48);
    const plan = verstringen(g, { a: [{ laenge: 12, anzahl: 2 }], b: [{ laenge: 8, anzahl: 3 }] });
    expect(plan.ok).toBe(true);
    expect(plan.strings.map((s) => s.nr)).toEqual([1, 2, 3, 4, 5]);
    expect(plan.strings.map((s) => s.module.length)).toEqual([12, 12, 8, 8, 8]);
    expect(plan.strings.map((s) => s.roofName)).toEqual(["D1", "D1", "D2", "D2", "D2"]);
    for (const [name, n] of [["D1", 24], ["D2", 24]] as const) {
      const alle = plan.strings.filter((s) => s.roofName === name).flatMap((s) => s.module).sort((x, y) => x - y);
      expect(alle).toEqual(Array.from({ length: n }, (_, i) => i));
    }
    expect(plan.laengen).toEqual({ 12: 2, 8: 3 });
    expect(stringZusammenfassung(plan)).toBe("5 Strings: 2 × 12 und 3 × 8 Module");
    expect(stringFarbe(1)).not.toBe(stringFarbe(2));
    expect(stringFarbe(13)).toBe(stringFarbe(1));
  });
  it("unvollständiger Plan wird gemeldet, vorhandene Strings bleiben erhalten", () => {
    const p = neuesProjekt();
    p.roofs = [dach("a", "D1", 0, 11)]; // 11 m Breite: 9 × 3 = 27? (Rechenkern bestimmt die Zahl)
    const g = rechne(p);
    const n = g.module;
    const plan = verstringen(g, { a: [{ laenge: 10, anzahl: 1 }] });
    expect(plan.ok).toBe(n === 10);
    expect(plan.strings).toHaveLength(1);
    expect(plan.daecher[0]!.meldungen.length).toBe(n === 10 ? 0 : 1);
  });
  it("Dachflächen ohne Plan oder ohne Module bekommen keine Strings", () => {
    const p = neuesProjekt();
    p.roofs = [dach("a", "D1", 0), { ...dach("b", "D2", 20), slopeDeg: null }];
    const plan = verstringen(rechne(p), { a: null, b: [{ laenge: 8, anzahl: 3 }] });
    expect(plan.strings).toEqual([]);
    expect(plan.daecher).toEqual([]);
  });
  it("zwei Gruppen an einer Dachfläche: Längen verschieden, Gruppennummern fortlaufend", () => {
    const p = neuesProjekt();
    p.roofs = [dach("a", "D1", 0)];
    const g = rechne(p); // 24 Module
    const plan = verstringen(g, { a: [{ laenge: 10, anzahl: 2 }, { laenge: 4, anzahl: 1 }] });
    expect(plan.strings.map((s) => [s.gruppe, s.module.length])).toEqual([[1, 10], [1, 10], [2, 4]]);
    expect(plan.ok).toBe(true);
  });
});
