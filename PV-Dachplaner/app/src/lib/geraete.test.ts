import { describe, expect, it } from "vitest";
import { MODULE, WECHSELRICHTER, stringGrenzen, modulPerId, wechselrichterPerId } from "./geraete";

const jw = modulPerId("jolywood-jw-hd96n-r2-460")!;
describe("Stringgrenzen", () => {
  it("SH10RT mit Jolywood 460: 8 bis 26 Module", () => {
    const g = stringGrenzen(jw, wechselrichterPerId("sungrow-sh10rt")!);
    expect(g.bereich).toEqual({ min: 8, max: 26 });
    expect(g.zeilen.length).toBeGreaterThan(2);
  });
  it("SH5.0RT hat wegen niedriger Startspannung eine kleinere Mindestlänge als SH10RT", () => {
    const a = stringGrenzen(jw, wechselrichterPerId("sungrow-sh5.0rt")!).bereich!;
    expect(a.min).toBe(6);
    expect(a.min).toBeLessThan(stringGrenzen(jw, wechselrichterPerId("sungrow-sh10rt")!).bereich!.min);
  });
  it("Sigen: Obergrenze durch 1100 V und Voc bei Kälte", () => {
    expect(stringGrenzen(jw, wechselrichterPerId("sigen-hybrid-tp2-8")!).bereich!.max).toBe(28);
  });
  it("MPP-Strom über Eingangsstrom wird gewarnt, Kurzschlussstrom im Rahmen bleibt zulässig", () => {
    const g = stringGrenzen(jw, wechselrichterPerId("sungrow-sh5.0rt")!);
    expect(g.ok).toBe(true);
    expect(g.warnungen.some((w) => w.includes("begrenzt"))).toBe(true);
  });
  it("Modul ohne Datenblattwerte liefert keinen Bereich", () => {
    const g = stringGrenzen(modulPerId("aiko-a485-mce54db")!, WECHSELRICHTER[0]!);
    expect(g.ok).toBe(false);
    expect(g.bereich).toBeNull();
  });
  it("alle Kennungen eindeutig", () => {
    const ids = [...MODULE.map((m) => m.id), ...WECHSELRICHTER.map((w) => w.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
