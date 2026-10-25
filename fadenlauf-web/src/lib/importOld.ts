import type { Inspo, Item, Outfit, Profile, Trip, WearEntry } from "./types";
import { emptyProfile } from "./types";
import { uid } from "./util";

export type Imported = { profile: Profile; items: Item[]; inspo: Inspo[]; outfits: Outfit[]; trips: Trip[]; wear: WearEntry[] };

/** Liest den JSON-Export der alten Artifact-Version (Schlüssel: profil, kleidung, inspirationen, outfits, reisen). */
export function parseOldExport(json: string): Imported {
  const d = JSON.parse(json);
  if (!d || typeof d !== "object" || !("profil" in d || "kleidung" in d)) throw new Error("Das ist kein Fadenlauf-Export.");
  const profile: Profile = { ...emptyProfile(), ...(d.profil ?? {}), onboarded: true };
  // Die alten Bild-IDs zeigen auf den Artifact-Speicher und sind hier nicht mehr gültig. Teile bleiben ohne Bild erhalten.
  const strip = <T extends { imageId?: unknown; origId?: unknown; cutId?: unknown }>(x: T) => ({ ...x, imageId: "", origId: null, cutId: null });
  const items = (d.kleidung ?? []).map((i: Item) => ({ ...strip(i), cutTried: true }));
  const inspo = (d.inspirationen ?? []).map((x: Inspo) => strip(x));
  const wear: WearEntry[] = [];
  const outfits: Outfit[] = (d.outfits ?? []).map((o: any) => {
    (o.wornDates ?? []).forEach((t: number) => wear.push({ id: uid(), outfitId: o.id, itemIds: o.itemIds ?? [], date: t }));
    const { wornDates: _w, ...rest } = o; return rest as Outfit;
  });
  return { profile, items, inspo, outfits, trips: d.reisen ?? [], wear };
}
