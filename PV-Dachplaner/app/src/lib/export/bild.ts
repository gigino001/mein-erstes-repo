import type { Project } from "../model";
import { WMS_DOP } from "../bildflug";

/** Rechteck in EPSG:25832 (Meter). */
export interface Bereich {
  minE: number;
  minN: number;
  maxE: number;
  maxN: number;
}

/** Rahmen um alle Dachflächen und Hindernisse plus Rand; mindestens 24 m Kantenlänge. */
export function bereichAus(p: Project, randM = 5): Bereich | null {
  const pts = [...p.roofs.flatMap((r) => r.outline), ...p.obstacles.flatMap((o) => o.outline)];
  if (pts.length === 0) return null;
  let minE = Math.min(...pts.map((q) => q.x)) - randM;
  let maxE = Math.max(...pts.map((q) => q.x)) + randM;
  let minN = Math.min(...pts.map((q) => q.y)) - randM;
  let maxN = Math.max(...pts.map((q) => q.y)) + randM;
  const mind = 24;
  if (maxE - minE < mind) {
    const m = (minE + maxE) / 2;
    minE = m - mind / 2;
    maxE = m + mind / 2;
  }
  if (maxN - minN < mind) {
    const m = (minN + maxN) / 2;
    minN = m - mind / 2;
    maxN = m + mind / 2;
  }
  return { minE, minN, maxE, maxN };
}

/** Passt das Rechteck an ein Seitenverhältnis (Breite/Höhe) an, indem die kürzere Seite um die Mitte erweitert wird. */
export function aufSeitenverhaeltnis(b: Bereich, verhaeltnis: number): Bereich {
  const w = b.maxE - b.minE;
  const h = b.maxN - b.minN;
  if (w / h > verhaeltnis) {
    const neu = w / verhaeltnis;
    const m = (b.minN + b.maxN) / 2;
    return { ...b, minN: m - neu / 2, maxN: m + neu / 2 };
  }
  const neu = h * verhaeltnis;
  const m = (b.minE + b.maxE) / 2;
  return { ...b, minE: m - neu / 2, maxE: m + neu / 2 };
}

export interface Luftbild {
  jpeg: Uint8Array;
  bereich: Bereich;
  breitePx: number;
  hoehePx: number;
}

export function luftbildUrl(b: Bereich, breitePx: number, hoehePx: number): string {
  return (
    `${WMS_DOP}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=nw_dop_rgb&STYLES=&CRS=EPSG:25832` +
    `&BBOX=${b.minE},${b.minN},${b.maxE},${b.maxN}&WIDTH=${breitePx}&HEIGHT=${hoehePx}&FORMAT=image/jpeg`
  );
}

/**
 * Lädt das NRW-Luftbild für den Bereich in EPSG:25832 (Norden oben). Die Quelle hat 10 cm je Pixel;
 * angefordert werden 5 cm, damit der Server weich interpoliert (mehr Detail gibt es nicht).
 */
export async function ladeLuftbild(b: Bereich, mProPixel = 0.05, maxPx = 3000): Promise<Luftbild> {
  const w = b.maxE - b.minE;
  const h = b.maxN - b.minN;
  const faktor = Math.min(1, maxPx / (w / mProPixel), maxPx / (h / mProPixel));
  const breitePx = Math.max(64, Math.round((w / mProPixel) * faktor));
  const hoehePx = Math.max(64, Math.round((h / mProPixel) * faktor));
  const r = await fetch(luftbildUrl(b, breitePx, hoehePx));
  if (!r.ok) throw new Error(`Luftbild nicht verfügbar (HTTP ${r.status})`);
  const typ = r.headers.get("content-type") ?? "";
  if (!typ.includes("jpeg")) throw new Error("Luftbild: unerwartete Antwort des Dienstes");
  return { jpeg: new Uint8Array(await r.arrayBuffer()), bereich: b, breitePx, hoehePx };
}
