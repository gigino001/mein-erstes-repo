import type { Item, Outfit, Profile, WearEntry } from "./types";
import { clamp5, dayStart, list, sig } from "./util";

export const ORDER: Record<string, number> = {
  "Jacken & Mäntel": 0, "Anzüge & Sakkos": 1, "Pullover & Strick": 2, "Sweatshirts & Hoodies": 2, Hemden: 3, "T-Shirts & Polos": 3,
  "Hosen & Jeans": 4, Shorts: 4, Gürtel: 5, "Schuhe & Sneaker": 6, "Uhren & Schmuck": 7, Taschen: 8, "Weitere Accessoires": 9,
};
export type Role = "outer" | "mid" | "top" | "bottom" | "shoes" | "acc";
const ROLES: Record<string, Role> = {
  "Jacken & Mäntel": "outer", "Anzüge & Sakkos": "outer", "Pullover & Strick": "mid", "Sweatshirts & Hoodies": "mid",
  Hemden: "top", "T-Shirts & Polos": "top", "Hosen & Jeans": "bottom", Shorts: "bottom", "Schuhe & Sneaker": "shoes",
};
export const roleOf = (category: string): Role => ROLES[category] ?? "acc";

export const usable = (items: Item[]) => items.filter((i) => !i.archived && i.status !== "pending");

/** Prüft eine KI-Antwort: nur echte, nicht archivierte IDs, mindestens zwei Teile, nach Lagen sortiert. */
export function cleanOutfit(raw: any, items: Item[]) {
  if (!raw) return null;
  const byId = new Map(items.map((i) => [i.id, i]));
  const ids = [...new Set(list(raw.itemIds))].filter((id) => { const i = byId.get(id); return i && !i.archived; });
  if (ids.length < 2) return null;
  ids.sort((a, b) => (ORDER[byId.get(a)!.category] ?? 9) - (ORDER[byId.get(b)!.category] ?? 9));
  return {
    label: String(raw.label || "Look").slice(0, 60), itemIds: ids, reason: String(raw.reason || ""), effect: String(raw.effect || ""),
    formality: clamp5(raw.formality), tips: String(raw.tips || ""), context: String(raw.context || ""),
  };
}

/** Weiche Regeln: fehlt Hose/Schuhe, oder gibt es doppelte Rollen? Liefert Warnungen statt zu verwerfen. */
export function outfitIssues(ids: string[], items: Item[]): string[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const count: Record<Role, number> = { outer: 0, mid: 0, top: 0, bottom: 0, shoes: 0, acc: 0 };
  ids.forEach((id) => { const i = byId.get(id); if (i) count[roleOf(i.category)]++; });
  const hasSuit = ids.some((id) => byId.get(id)?.category === "Anzüge & Sakkos");
  const out: string[] = [];
  const wardrobeHas = (r: Role) => items.some((i) => roleOf(i.category) === r && !i.archived);
  if (!count.bottom && wardrobeHas("bottom") && !hasSuit) out.push("Keine Hose");
  if (!count.shoes && wardrobeHas("shoes")) out.push("Keine Schuhe");
  if (count.bottom > 1) out.push("Zwei Hosen");
  if (count.shoes > 1) out.push("Zwei Paar Schuhe");
  return out;
}

export function wearStats(wear: WearEntry[]) {
  const m: Record<string, { n: number; last: number }> = {};
  for (const w of wear) for (const id of w.itemIds) {
    const e = (m[id] ??= { n: 0, last: 0 });
    e.n++; if (w.date > e.last) e.last = w.date;
  }
  return m;
}
export const wornToday = (wear: WearEntry[], outfitId: string, now = Date.now()) => wear.some((w) => w.outfitId === outfitId && w.date >= dayStart(now));
export const wornCount = (wear: WearEntry[], outfitId: string) => wear.filter((w) => w.outfitId === outfitId).length;

export function recentlyWorn(items: Item[], wear: WearEntry[], now = Date.now()) {
  const lim = dayStart(now) - 3 * 864e5; const ws = wearStats(wear);
  return usable(items).filter((i) => ws[i.id] && ws[i.id].last >= lim);
}

/** Feedback-Zeilen für den Prompt. 0 bei Einzelteilen bedeutet „zurückgenommen“ und wird ignoriert. */
export function feedbackLines(outfits: Outfit[], items: Item[], wear: WearEntry[], n = 25): string {
  const nameOf = (id: string) => items.find((i) => i.id === id)?.name;
  return outfits
    .filter((o) => o.rating || o.fav || Object.values(o.itemFeedback ?? {}).some(Boolean) || (o.adjustments ?? []).length || wornCount(wear, o.id))
    .slice(0, n)
    .map((o) => {
      const names = o.itemIds.map(nameOf).filter(Boolean).join(", ");
      const worn = wornCount(wear, o.id);
      const tag = [worn ? `getragen ${worn}×` : "", o.fav ? "Favorit" : "", o.rating === 1 ? "gefällt" : "", o.rating === -1 ? "abgelehnt" : ""].filter(Boolean).join(", ") || "neutral";
      const itf = Object.entries(o.itemFeedback ?? {}).filter(([, v]) => v !== 0).map(([id, v]) => `${nameOf(id) ?? "?"} ${v > 0 ? "passt" : "passt nicht"}`).join("; ");
      return `- [${tag}] Anlass: "${o.request || "-"}" | Teile: ${names}${o.rejectReason ? " | Grund: " + o.rejectReason : ""}${itf ? " | Einzelteile: " + itf : ""}${(o.adjustments ?? []).length ? " | Gewünschte Änderungen: " + o.adjustments!.join(", ") : ""}`;
    }).join("\n");
}

/** Kombinationen, die nicht erneut vorgeschlagen werden sollen. */
export const avoidSignatures = (outfits: Outfit[], shown: Outfit[] = []) =>
  [...new Set([...outfits.filter((o) => o.rating === -1).slice(0, 10), ...shown].map((o) => sig(o.itemIds)))];

/**
 * Kandidaten für den Prompt: bei großen Schränken Saison- und Formalitäts-Vorfilter,
 * aber jede Kategorie bleibt vertreten, damit immer komplette Looks möglich sind.
 */
export function candidateItems(items: Item[], opts: { season: string; limit?: number }): Item[] {
  const all = usable(items); const limit = opts.limit ?? 90;
  if (all.length <= limit) return all;
  const fits = (i: Item) => !(i.seasons ?? []).length || i.seasons.includes(opts.season);
  const seasonal = all.filter(fits);
  const keep = new Set(seasonal.map((i) => i.id));
  (["outer", "mid", "top", "bottom", "shoes", "acc"] as Role[]).forEach((r) => {
    const have = seasonal.filter((i) => roleOf(i.category) === r).length;
    if (have < 3) all.filter((i) => roleOf(i.category) === r).slice(0, 5).forEach((i) => keep.add(i.id));
  });
  return all.filter((i) => keep.has(i.id)).slice(0, limit);
}

export function season(d: Date, hemisphere: Profile["hemisphere"] = "north") {
  const m = d.getMonth();
  const north = m < 2 || m === 11 ? "Winter" : m < 5 ? "Frühling" : m < 8 ? "Sommer" : "Herbst";
  if (hemisphere === "north") return north;
  return ({ Winter: "Sommer", Sommer: "Winter", Frühling: "Herbst", Herbst: "Frühling" } as const)[north];
}
