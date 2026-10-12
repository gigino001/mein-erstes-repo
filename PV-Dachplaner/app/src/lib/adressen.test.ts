import { describe, expect, it } from "vitest";
import { abstandText, loeseAuf, ortVorschlaege, schluessel, strassenVorschlaege, zerlege, type GemeindeDaten, type GemeindeInfo, type Lader } from "./adressen";

const gemeinden: GemeindeInfo[] = [
  { key: "11_000", gmd: "Bielefeld", kreis: "Bielefeld", strassen: 3, adressen: 7 },
  { key: "54_008", gmd: "Gütersloh", kreis: "Gütersloh", strassen: 1, adressen: 1 },
  { key: "66_012", gmd: "Horn-Bad Meinberg", kreis: "Lippe", strassen: 1, adressen: 1 },
  { key: "57_004", gmd: "Bad Lippspringe", kreis: "Paderborn", strassen: 1, adressen: 1 },
];
const bielefeld: GemeindeDaten = {
  e0: 466000,
  n0: 5760000,
  s: {
    "Herforder Straße": [["12", "", 100, 200], ["12", "a", 150, 210], ["14", "", 300, 220], ["120", "", 900, 250]],
    Niederwall: [["23", "", 2000, 2500]],
    "Herforder Weg": [["1", "", 10, 10]],
    "Am Brodhagen": [["5", "", 5000, 5000]],
  },
};
const lader: Lader = {
  gemeinden: async () => gemeinden,
  daten: async (key) => {
    if (key !== "11_000") throw new Error("keine Daten");
    return bielefeld;
  },
};

describe("Schlüssel und Abstand", () => {
  it("vereinheitlicht Schreibweisen", () => {
    const ziel = schluessel("Herforder Straße");
    for (const v of ["Herforder Str.", "herforder strasse", "Herforder Str", "HERFORDER STRAßE", "Herforder-Straße"]) expect(schluessel(v)).toBe(ziel);
    expect(schluessel("Gütersloh")).toBe(schluessel("Guetersloh"));
    expect(schluessel("Köln")).toBe(schluessel("Koeln"));
  });
  it("Bearbeitungsabstand", () => {
    expect(abstandText("abc", "abc")).toBe(0);
    expect(abstandText("abc", "abd")).toBe(1);
    expect(abstandText("abcdef", "abc", 2)).toBeGreaterThan(2);
  });
});

describe("Eingabe zerlegen", () => {
  it("Straße, Nummer mit Zusatz und Ort", () => {
    const e = zerlege("Herforder Str. 12 a, Bielefeld", gemeinden);
    expect(e.strasse).toEqual(["Herforder", "Str."]);
    expect(e.nummer).toEqual({ zahl: "12", zusatz: "a" });
    expect(e.gemeinde?.gmd).toBe("Bielefeld");
  });
  it("Nummer mit angehängtem Buchstaben, Postleitzahl wird ignoriert", () => {
    const e = zerlege("Niederwall 23b 33602 Bielefeld", gemeinden);
    expect(e.strasse).toEqual(["Niederwall"]);
    expect(e.nummer).toEqual({ zahl: "23", zusatz: "b" });
    expect(e.gemeinde?.gmd).toBe("Bielefeld");
  });
  it("Hausnummer vor der Straße; Ort aus mehreren Wörtern", () => {
    const e = zerlege("5 Am Brodhagen Horn-Bad Meinberg", gemeinden);
    expect(e.nummer).toEqual({ zahl: "5", zusatz: "" });
    expect(e.gemeinde?.gmd).toBe("Horn-Bad Meinberg");
    expect(zerlege("Hauptstr 1 Bad Lippspringe", gemeinden).gemeinde?.gmd).toBe("Bad Lippspringe");
  });
  it("ohne Ort bleibt die Gemeinde leer", () => {
    const e = zerlege("Herforder Straße 12", gemeinden);
    expect(e.gemeinde).toBeNull();
    expect(e.strasse).toEqual(["Herforder", "Straße"]);
  });
  it("der Ortsname allein wird nicht als Straße verschluckt", () => {
    expect(zerlege("Bielefeld", gemeinden).gemeinde).toBeNull();
    expect(zerlege("Bielefeld", gemeinden).strasse).toEqual(["Bielefeld"]);
  });
});

describe("Vorschläge", () => {
  it("Orte: Anfang, ohne Umlaute, Teilwort", () => {
    expect(ortVorschlaege("biel", gemeinden).map((v) => v.text)).toEqual(["Bielefeld (Bielefeld)"]);
    expect(ortVorschlaege("guetersl", gemeinden)[0]?.text).toContain("Gütersloh");
    expect(ortVorschlaege("mein", gemeinden)[0]?.text).toContain("Horn-Bad Meinberg");
    expect(ortVorschlaege("", gemeinden)).toEqual([]);
    expect(ortVorschlaege("xyz", gemeinden)).toEqual([]);
  });
  const g = gemeinden[0]!;
  it("Straßen nach Anfang (kürzester Name zuerst, dann alphabetisch)", () => {
    const v = strassenVorschlaege(zerlege("herf", gemeinden), g, bielefeld);
    expect(v.map((x) => x.art === "strasse" && x.strasse)).toEqual(["Herforder Straße", "Herforder Weg"]);
  });
  it("Hausnummer schränkt auf passende Adressen ein", () => {
    const v = strassenVorschlaege(zerlege("herforder strasse 12", gemeinden), g, bielefeld);
    expect(v.map((x) => x.text)).toEqual(["Herforder Straße 12, Bielefeld", "Herforder Straße 12a, Bielefeld", "Herforder Straße 120, Bielefeld"]);
    const genau = strassenVorschlaege(zerlege("herforder strasse 12a", gemeinden), g, bielefeld);
    expect(genau.map((x) => x.text)).toEqual(["Herforder Straße 12a, Bielefeld"]);
  });
  it("Tippfehler im Straßennamen wird gefunden", () => {
    const v = strassenVorschlaege(zerlege("Niderwall 23", gemeinden), g, bielefeld);
    expect(v[0]?.text).toBe("Niederwall 23, Bielefeld");
    const v2 = strassenVorschlaege(zerlege("Herforder Staße 14", gemeinden), g, bielefeld);
    expect(v2.map((x) => x.text)).toContain("Herforder Straße 14, Bielefeld");
  });
  it("nichts gefunden: leere Liste", () => {
    expect(strassenVorschlaege(zerlege("Zzzzzz 1", gemeinden), g, bielefeld)).toEqual([]);
    expect(strassenVorschlaege(zerlege("", gemeinden), g, bielefeld)).toEqual([]);
  });
});

describe("Auflösen mit Enter", () => {
  it("liefert die Koordinate (UTM) der besten Adresse", async () => {
    const a = await loeseAuf("herforder str. 12a, bielefeld", lader);
    expect(a?.text).toBe("Herforder Straße 12a, Bielefeld");
    expect(a?.e).toBeCloseTo(466015, 6);
    expect(a?.n).toBeCloseTo(5760021, 6);
  });
  it("ohne Ort greift der Standardort", async () => {
    expect((await loeseAuf("Niederwall 23", lader, "11_000"))?.n).toBeCloseTo(5760250, 6);
    expect(await loeseAuf("Niederwall 23", lader)).toBeNull();
  });
  it("ohne Hausnummer keine Adresse", async () => {
    expect(await loeseAuf("Niederwall, Bielefeld", lader)).toBeNull();
  });
});
