import { describe, expect, it } from "vitest";
import { avoidSignatures, candidateItems, cleanOutfit, feedbackLines, outfitIssues, season, wearStats, wornToday } from "../src/lib/logic";
import { parseOldExport } from "../src/lib/importOld";
import { parseJson } from "../src/lib/ai";
import type { Item, Outfit, WearEntry } from "../src/lib/types";

const item = (id: string, category: string, extra: Partial<Item> = {}): Item => ({ id, imageId: id, origId: null, cutId: null, status: "ready", createdAt: 1, name: id, category, color: "", pattern: "", material: "", details: "", fit: "", styles: [], seasons: [], weather: "", formality: 3, occasions: [], uncertain: [], ...extra });
const outfit = (id: string, itemIds: string[], extra: Partial<Outfit> = {}): Outfit => ({ id, label: id, itemIds, reason: "", effect: "", formality: 3, tips: "", context: "", request: "Büro", createdAt: 1, rating: 0, fav: false, ...extra });
const wardrobe = [item("h1", "Hemden"), item("j1", "Hosen & Jeans"), item("s1", "Schuhe & Sneaker"), item("old", "Hemden", { archived: true })];

describe("cleanOutfit", () => {
  it("verwirft erfundene und archivierte IDs", () => {
    const c = cleanOutfit({ itemIds: ["h1", "ERFUNDEN", "old", "j1"] }, wardrobe)!;
    expect(c.itemIds).toEqual(["h1", "j1"]);
  });
  it("lehnt Outfits mit weniger als zwei echten Teilen ab", () => { expect(cleanOutfit({ itemIds: ["h1", "x"] }, wardrobe)).toBeNull(); expect(cleanOutfit(null, wardrobe)).toBeNull(); });
  it("sortiert nach Lagen und begrenzt Formalität", () => {
    const c = cleanOutfit({ itemIds: ["s1", "j1", "h1"], formality: 99, label: "x".repeat(200) }, wardrobe)!;
    expect(c.itemIds).toEqual(["h1", "j1", "s1"]); expect(c.formality).toBe(5); expect(c.label.length).toBe(60);
  });
  it("akzeptiert IDs als Komma-Text", () => { expect(cleanOutfit({ itemIds: "h1, j1" }, wardrobe)!.itemIds).toEqual(["h1", "j1"]); });
});

describe("outfitIssues", () => {
  it("meldet fehlende Hose und Schuhe nur, wenn der Schrank sie hat", () => {
    expect(outfitIssues(["h1"], wardrobe)).toEqual(["Keine Hose", "Keine Schuhe"]);
    expect(outfitIssues(["h1"], [item("h1", "Hemden")])).toEqual([]);
    expect(outfitIssues(["h1", "j1", "s1"], wardrobe)).toEqual([]);
  });
});

describe("feedbackLines (Bugfix: 0 = zurückgenommen)", () => {
  it("zeigt zurückgenommenes Einzelteil-Feedback nicht als „passt nicht“", () => {
    const o = outfit("o1", ["h1", "j1"], { itemFeedback: { h1: 0, j1: -1 }, rating: 1 });
    const t = feedbackLines([o], wardrobe, []);
    expect(t).toContain("j1 passt nicht"); expect(t).not.toContain("h1 passt");
  });
  it("lässt Outfits aus, die nur zurückgenommenes Feedback haben", () => {
    expect(feedbackLines([outfit("o1", ["h1", "j1"], { itemFeedback: { h1: 0 } })], wardrobe, [])).toBe("");
  });
});

describe("Tragen-Statistik (Bugfix: kein 300er-Limit)", () => {
  const w = (i: number, ids: string[], date: number): WearEntry => ({ id: "w" + i, outfitId: "o", itemIds: ids, date });
  it("zählt alle Einträge, auch sehr viele", () => {
    const wear = Array.from({ length: 1000 }, (_, i) => w(i, ["h1"], 1000 + i));
    expect(wearStats(wear).h1).toEqual({ n: 1000, last: 1999 });
  });
  it("erkennt „heute getragen“", () => { const now = new Date(2026, 5, 10, 15).getTime(); expect(wornToday([{ ...w(1, [], now - 3600_000), outfitId: "o" }], "o", now)).toBe(true); expect(wornToday([w(1, [], now - 2 * 864e5)], "o", now)).toBe(false); });
});

describe("Kandidaten & Wiederholungen", () => {
  it("kleine Schränke bleiben vollständig", () => { expect(candidateItems(wardrobe, { season: "Winter" }).map((i) => i.id)).toEqual(["h1", "j1", "s1"]); });
  it("große Schränke werden gekürzt, behalten aber jede Rolle", () => {
    const big = [...Array.from({ length: 150 }, (_, i) => item("t" + i, "T-Shirts & Polos", { seasons: ["Sommer"] })), item("shoe", "Schuhe & Sneaker", { seasons: ["Sommer"] }), item("pant", "Hosen & Jeans", { seasons: ["Sommer"] })];
    const c = candidateItems(big, { season: "Winter", limit: 90 });
    expect(c.length).toBeLessThanOrEqual(90); expect(c.map((i) => i.id)).toEqual(expect.arrayContaining(["shoe", "pant"]));
  });
  it("sammelt abgelehnte Kombinationen reihenfolgeunabhängig", () => {
    expect(avoidSignatures([outfit("a", ["j1", "h1"], { rating: -1 }), outfit("b", ["s1", "h1"])], [outfit("c", ["h1", "j1"])])).toEqual(["h1|j1"]);
  });
  it("Südhalbkugel dreht die Jahreszeit", () => { const jan = new Date(2026, 0, 15); expect(season(jan)).toBe("Winter"); expect(season(jan, "south")).toBe("Sommer"); });
});

describe("Import des alten Exports", () => {
  it("wandelt wornDates in Tragen-Einträge um und entfernt tote Bild-IDs", () => {
    const d = parseOldExport(JSON.stringify({ profil: { name: "A" }, kleidung: [{ id: "h1", imageId: "alt", name: "Hemd" }], outfits: [{ id: "o1", itemIds: ["h1"], wornDates: [1, 2] }], reisen: [] }));
    expect(d.wear).toHaveLength(2); expect(d.items[0].imageId).toBe(""); expect(d.profile.onboarded).toBe(true); expect((d.outfits[0] as any).wornDates).toBeUndefined();
  });
  it("lehnt fremde Dateien ab", () => { expect(() => parseOldExport("{}")).toThrow(); });
});

describe("parseJson", () => {
  it("entfernt Codezäune und Beiwerk", () => { expect(parseJson('```json\n{"a":1}\n```')).toEqual({ a: 1 }); expect(parseJson('Hier: {"a":2} fertig')).toEqual({ a: 2 }); });
  it("wirft bei Unsinn", () => { expect(() => parseJson("nichts")).toThrow(); });
});
