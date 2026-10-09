import { describe, expect, it } from "vitest";
import { dachflaechenText, geaendertText, himmelsrichtung } from "./format";

describe("Anzeigetexte", () => {
  const jetzt = new Date(2026, 9, 9, 12, 0);
  it("heute, gestern, früher", () => {
    expect(geaendertText(new Date(2026, 9, 9, 10, 42).toISOString(), jetzt)).toBe("heute 10:42");
    expect(geaendertText(new Date(2026, 9, 8, 9, 5).toISOString(), jetzt)).toBe("gestern 09:05");
    expect(geaendertText(new Date(2026, 9, 3, 9, 5).toISOString(), jetzt)).toBe("03.10.2026");
    expect(geaendertText("kaputt", jetzt)).toBe("");
  });
  it("Dachflächen", () => {
    expect(dachflaechenText(0)).toBe("noch keine Dachfläche");
    expect(dachflaechenText(1)).toBe("1 Dachfläche");
    expect(dachflaechenText(3)).toBe("3 Dachflächen");
  });
  it("Himmelsrichtung", () => {
    expect(himmelsrichtung(180)).toBe("S");
    expect(himmelsrichtung(0)).toBe("N");
    expect(himmelsrichtung(359)).toBe("N");
    expect(himmelsrichtung(225)).toBe("SW");
    expect(himmelsrichtung(-90)).toBe("W");
    expect(himmelsrichtung(112)).toBe("O");
    expect(himmelsrichtung(114)).toBe("SO");
  });
});
