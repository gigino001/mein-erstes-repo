import { describe, expect, it } from "vitest";
import { ausrichtungVonKante, naechsteKante, flaeche, kantenLaengen, kantenMitte, punktEinfuegen, punktInVieleck, punktLoeschen, selbstschnitt, verschieben } from "./geom";
import { Verlauf } from "./verlauf";

const quadrat = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 }];

describe("Vieleck-Werkzeuge", () => {
  it("Fläche und Seitenlängen", () => {
    expect(flaeche(quadrat)).toBe(50);
    expect(flaeche([...quadrat].reverse())).toBe(50);
    expect(kantenLaengen(quadrat)).toEqual([10, 5, 10, 5]);
  });
  it("Punkt im Vieleck (auch nicht konvex)", () => {
    expect(punktInVieleck({ x: 5, y: 2 }, quadrat)).toBe(true);
    expect(punktInVieleck({ x: 11, y: 2 }, quadrat)).toBe(false);
    const L = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 8 }, { x: 0, y: 8 }];
    expect(punktInVieleck({ x: 2, y: 6 }, L)).toBe(true);
    expect(punktInVieleck({ x: 8, y: 6 }, L)).toBe(false);
  });
  it("erkennt sich kreuzende Kanten", () => {
    expect(selbstschnitt(quadrat)).toBe(false);
    expect(selbstschnitt([{ x: 0, y: 0 }, { x: 4, y: 4 }, { x: 4, y: 0 }, { x: 0, y: 4 }])).toBe(true);
    expect(selbstschnitt([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 2, y: 3 }])).toBe(false);
  });
  it("Punkt einfügen, löschen (mindestens 3), verschieben – ohne das Original zu ändern", () => {
    const eingefuegt = punktEinfuegen(quadrat, 0, { x: 5, y: 0 });
    expect(eingefuegt).toHaveLength(5);
    expect(eingefuegt[1]).toEqual({ x: 5, y: 0 });
    expect(quadrat).toHaveLength(4);
    expect(punktLoeschen(quadrat, 1)).toHaveLength(3);
    expect(punktLoeschen([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], 0)).toHaveLength(3);
    expect(verschieben(quadrat, 2, -1)[0]).toEqual({ x: 2, y: -1 });
    expect(quadrat[0]).toEqual({ x: 0, y: 0 });
    expect(kantenMitte(quadrat, 0)).toEqual({ x: 5, y: 0 });
    expect(kantenMitte(quadrat, 3)).toEqual({ x: 0, y: 2.5 });
  });
});

describe("Fallrichtung aus der Traufkante", () => {
  const ccw = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 }];
  const cw = [...ccw].reverse();
  it("untere Kante (Süden) ergibt 180°, obere 0°, rechte 90°, linke 270° – unabhängig vom Umlaufsinn", () => {
    for (const ring of [ccw, cw]) {
      const idx = (a: { x: number; y: number }, b: { x: number; y: number }) => ring.findIndex((p, i) => {
        const q = ring[(i + 1) % ring.length]!;
        return (p.x === a.x && p.y === a.y && q.x === b.x && q.y === b.y) || (p.x === b.x && p.y === b.y && q.x === a.x && q.y === a.y);
      });
      expect(ausrichtungVonKante(ring, idx({ x: 0, y: 0 }, { x: 10, y: 0 }))).toBe(180);
      expect(ausrichtungVonKante(ring, idx({ x: 0, y: 5 }, { x: 10, y: 5 }))).toBe(0);
      expect(ausrichtungVonKante(ring, idx({ x: 10, y: 0 }, { x: 10, y: 5 }))).toBe(90);
      expect(ausrichtungVonKante(ring, idx({ x: 0, y: 0 }, { x: 0, y: 5 }))).toBe(270);
    }
  });
  it("schräge Kante: nach Südwesten geneigte Kante ergibt 225°", () => {
    const raute = [{ x: 0, y: 0 }, { x: 4, y: -4 }, { x: 8, y: 0 }, { x: 4, y: 4 }];
    expect(ausrichtungVonKante(raute, 0)).toBe(225);
  });
  it("nächste Kante", () => {
    expect(naechsteKante(ccw, { x: 5, y: 0.3 })).toEqual({ index: 0, abstand: 0.3 });
    expect(naechsteKante(ccw, { x: 9.8, y: 2 }).index).toBe(1);
  });
});

describe("Verlauf", () => {
  it("rückgängig und wiederholen", () => {
    const v = new Verlauf<number[]>();
    let stand = [1];
    v.merken(stand); stand = [1, 2];
    v.merken(stand); stand = [1, 2, 3];
    expect(v.kannZurueck).toBe(true);
    stand = v.rueckgaengig(stand)!;
    expect(stand).toEqual([1, 2]);
    stand = v.rueckgaengig(stand)!;
    expect(stand).toEqual([1]);
    expect(v.rueckgaengig(stand)).toBeNull();
    stand = v.wiederholen(stand)!;
    expect(stand).toEqual([1, 2]);
    expect(v.kannVor).toBe(true);
  });
  it("neue Änderung verwirft Wiederholen und begrenzt die Länge", () => {
    const v = new Verlauf<number>(3);
    for (let i = 0; i < 10; i++) v.merken(i);
    let n = 0;
    let s: number | null = 10;
    while ((s = v.rueckgaengig(s)) !== null) n++;
    expect(n).toBe(3);
    v.merken(1);
    expect(v.kannVor).toBe(false);
  });
});
