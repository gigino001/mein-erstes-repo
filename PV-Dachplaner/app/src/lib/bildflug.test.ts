import { describe, expect, it } from "vitest";
import { alterJahre, bildInfoUrl, datumDeutsch, parseBildInfo } from "./bildflug";

const ANTWORT = `GetFeatureInfo results:

Layer 'nw_dop_utm_info'
  Feature 9372: 
    Kachelname = '32466_5764'
    Bildflugdatum = '13.08.2024'
    Bodenauflösung = '0.10'
    Photometrie = 'RGBI'
    Bit_pro_Kanal = '8'
`;

describe("Befliegungsdatum", () => {
  it("liest die echte Antwort des Dienstes", () => {
    expect(parseBildInfo(ANTWORT)).toEqual({ kachel: "32466_5764", datum: "2024-08-13", aufloesung: 0.1 });
  });
  it("liefert null bei leerer oder unbekannter Antwort", () => {
    expect(parseBildInfo("")).toBeNull();
    expect(parseBildInfo("Layer 'x'\n  Feature 1:\n")).toBeNull();
    expect(parseBildInfo("Bildflugdatum = 'morgen'\nKachelname = 'a'")).toBeNull();
  });
  it("baut eine Anfrage-Adresse in EPSG:25832", () => {
    const u = bildInfoUrl({ e: 466845, n: 5764729 });
    expect(u).toContain("CRS=EPSG:25832");
    expect(u).toContain("BBOX=466795,5764679,466895,5764779");
  });
  it("Alter in Jahren", () => {
    expect(alterJahre("2024-08-13", new Date("2026-10-09T00:00:00Z"))).toBe(2);
    expect(alterJahre("2023-10-10", new Date("2026-10-09T00:00:00Z"))).toBe(2);
    expect(alterJahre("2023-10-09", new Date("2026-10-09T00:00:00Z"))).toBe(3);
  });
  it("deutsches Datum", () => {
    expect(datumDeutsch("2024-08-13")).toBe("13.08.2024");
  });
});
