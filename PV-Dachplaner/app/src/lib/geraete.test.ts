import { describe, expect, it } from "vitest";
import { MODULE, WECHSELRICHTER, stringGrenzen, modulPerId, wechselrichterPerId } from "./geraete";

const jw = modulPerId("jolywood-jw-hd96n-r2-460")!;
describe("Stringgrenzen", () => {
  it("SH5.0T mit Jolywood 460: 6 bis 26 Module, mit Rechenweg", () => {
    const g = stringGrenzen(jw, wechselrichterPerId("sungrow-sh5.0t")!);
    expect(g.bereich).toEqual({ min: 6, max: 26 });
    expect(g.zeilen.length).toBeGreaterThan(2);
  });
  it("Sigen: Obergrenze durch 1100 V, Untergrenze durch 160 V MPPT-Minimum", () => {
    expect(stringGrenzen(jw, wechselrichterPerId("sigen-hybrid-tp2-8")!).bereich).toEqual({ min: 7, max: 28 });
  });
  it("AIKO A485 an SH5.0T: 5 bis 22 Module (höhere Spannung je Modul)", () => {
    expect(stringGrenzen(modulPerId("aiko-a485-mce54db")!, wechselrichterPerId("sungrow-sh5.0t")!).bereich).toEqual({ min: 5, max: 22 });
  });
  it("MPP-Strom über Eingangsstrom wird gewarnt, zu hoher Kurzschlussstrom ist ein Fehler", () => {
    const w = wechselrichterPerId("sungrow-sh5.0t")!;
    expect(stringGrenzen({ ...jw, imppA: 17 }, w).warnungen.some((x) => x.includes("begrenzt"))).toBe(true);
    const g = stringGrenzen({ ...jw, iscA: 21 }, w);
    expect(g.ok).toBe(false);
    expect(g.fehler.join()).toContain("Kurzschlussstrom");
  });
  it("Modul ohne Spannungswerte liefert keinen Bereich", () => {
    const g = stringGrenzen({ ...jw, vocV: NaN }, WECHSELRICHTER[0]!);
    expect(g.ok).toBe(false);
    expect(g.bereich).toBeNull();
  });
  it("fehlende Systemspannung des Moduls: Grenze des Wechselrichters gilt, mit Hinweis", () => {
    const g = stringGrenzen({ ...jw, maxSystemV: NaN }, wechselrichterPerId("sungrow-sh5.0t")!);
    expect(g.bereich).toEqual({ min: 6, max: 26 });
    expect(g.warnungen.join()).toContain("Systemspannung");
  });
  it("alle Kennungen eindeutig", () => {
    const ids = [...MODULE.map((m) => m.id), ...WECHSELRICHTER.map((w) => w.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

import { wechselrichterPruefung } from "./geraete";
describe("Prüfung gegen den Wechselrichter", () => {
  const s = (nr: number, mppt: number | null) => ({ nr, mppt, gruppe: 0, roofId: "a" });
  it("MPPT-Nummer, Stringzahl und Kurzschlussstrom je Eingang", () => {
    const w = wechselrichterPerId("sungrow-sh10t")!;
    expect(wechselrichterPruefung([s(1, 1), s(2, 1), s(3, 2)], jw, w).fehler).toEqual([]);
    expect(wechselrichterPruefung([s(1, 2), s(2, 2)], jw, w).fehler.join()).toContain("MPPT 2: 2 Strings");
    expect(wechselrichterPruefung([s(1, 3)], jw, w).fehler.join()).toContain("MPPT 3 gibt es");
  });
});
