import { describe, expect, it } from "vitest";
import { beispielRechnung } from "./demo";

describe("Rechenkern in der App", () => {
  it("liefert das Beispiel aus dem Plan: 61,04 m², 24 Module, 11,04 kWp", () => {
    const r = beispielRechnung();
    expect(r.flaecheM2).toBeCloseTo(61.04, 2);
    expect(r.module).toBe(24);
    expect(r.kWp).toBeCloseTo(11.04, 6);
  });
});
