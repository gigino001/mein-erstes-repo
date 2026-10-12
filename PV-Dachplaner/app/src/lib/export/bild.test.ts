import { describe, expect, it } from "vitest";
import { aufSeitenverhaeltnis, bereichAus, luftbildUrl } from "./bild";
import { neuesProjekt } from "../model";

describe("Bildbereich", () => {
  const p = neuesProjekt();
  it("leeres Projekt: kein Bereich", () => {
    expect(bereichAus(p)).toBeNull();
  });
  it("Rahmen um Dachflächen und Hindernisse plus Rand", () => {
    p.roofs = [{ id: "a", name: "D1", outline: [{ x: 466000, y: 5764000 }, { x: 466030, y: 5764000 }, { x: 466030, y: 5764020 }, { x: 466000, y: 5764020 }], slopeDeg: 30, azimuthDeg: 180, quelle: "manuell" }];
    p.obstacles = [{ id: "o", art: "kamin", outline: [{ x: 466031, y: 5764010 }, { x: 466033, y: 5764010 }, { x: 466033, y: 5764012 }], bufferM: 0, abziehen: true }];
    const b = bereichAus(p, 5)!;
    expect(b).toEqual({ minE: 465995, maxE: 466038, minN: 5763995, maxN: 5764025 });
  });
  it("kleine Dächer bekommen mindestens 24 m Kantenlänge", () => {
    const q = neuesProjekt();
    q.roofs = [{ id: "a", name: "D1", outline: [{ x: 100, y: 100 }, { x: 104, y: 100 }, { x: 104, y: 103 }], slopeDeg: 30, azimuthDeg: 180, quelle: "manuell" }];
    const b = bereichAus(q, 2)!;
    expect(b.maxE - b.minE).toBeGreaterThanOrEqual(24);
    expect(b.maxN - b.minN).toBeGreaterThanOrEqual(24);
  });
  it("Seitenverhältnis wird um die Mitte erweitert, nicht verzerrt", () => {
    const b = { minE: 0, maxE: 40, minN: 0, maxN: 10 };
    const r = aufSeitenverhaeltnis(b, 1);
    expect(r.maxE - r.minE).toBe(40);
    expect(r.maxN - r.minN).toBe(40);
    expect((r.minN + r.maxN) / 2).toBe(5);
    const s = aufSeitenverhaeltnis({ minE: 0, maxE: 10, minN: 0, maxN: 40 }, 2);
    expect(s.maxN - s.minN).toBe(40);
    expect(s.maxE - s.minE).toBe(80);
  });
  it("Abruf-Adresse in EPSG:25832 mit Koordinaten in der Reihenfolge Ost, Nord", () => {
    const u = luftbildUrl({ minE: 466000, minN: 5764000, maxE: 466040, maxN: 5764030 }, 800, 600);
    expect(u).toContain("CRS=EPSG:25832");
    expect(u).toContain("BBOX=466000,5764000,466040,5764030");
    expect(u).toContain("WIDTH=800&HEIGHT=600");
  });
});
