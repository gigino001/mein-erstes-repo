// @ts-nocheck – Fixture-Code aus dem alten Projekt, bewusst unverändert übernommen

import { describe, expect, it } from "vitest";
import { computeMask } from "../src/lib/cutout";

describe("Freistellen", () => {
  let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647), seed / 2147483647);
const W = 360, H = 480;

function img(bgFn: any, shape: any, col: any, shadow?: any) {
  const px = new Uint8ClampedArray(W * H * 4), gt = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; let c = bgFn(x, y);
    if (shadow && shadow(x, y) > 0) c = c.map((v: number) => v * 0.65);
    if (shape(x, y)) { gt[i] = 1; const n = (rnd() - 0.5) * 18; c = col(x, y).map((v: number) => v + n); }
    px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2]; px[i * 4 + 3] = 255;
  }
  return { px, gt };
}
const cx = W / 2;
const shirt = (x, y) => (y > 90 && y < 430 && Math.abs(x - cx) < 85) || (y > 90 && y < 200 && Math.abs(x - cx) < 85 + (200 - y) * 0.9);
const shirtFull = (x, y) => (y > 60 && Math.abs(x - cx) < 120) || (y > 60 && y < 220);
const jeans = (x, y) => y > 70 && y < 420 && ((y < 160 && Math.abs(x - cx) < 70) || (y >= 160 && Math.abs(Math.abs(x - cx) - 35) < 32));
const shoe = (x, y) => ((x - 180) / 110) ** 2 + ((y - 300) / 45) ** 2 < 1;
const wood = (x, y) => { const s = Math.sin(x * 0.08 + Math.sin(y * 0.02) * 3) * 14 + (rnd() - 0.5) * 22; return [150 + s, 105 + s * 0.8, 70 + s * 0.6]; };
const sheet = (x, y) => { const s = Math.sin(x * 0.05 + y * 0.03) * 9 + Math.sin(y * 0.11) * 6 + (rnd() - 0.5) * 10; return [232 + s, 230 + s, 226 + s]; };
const floor = (x, y) => { const g = 185 - y * 0.08 + (rnd() - 0.5) * 14; return [g, g, g + 3]; };
const dark = () => { const s = (rnd() - 0.5) * 12; return [45 + s, 48 + s, 55 + s]; };
const busy = () => [rnd() * 255, rnd() * 255, rnd() * 255];

// expect: "cut" = muss sauber freistellen (IoU ≥ 0.9), "reject" = muss ablehnen statt Müll zu liefern
const cases = [
  ["Navy-Hemd auf Holzboden mit Schatten", img(wood, shirt, () => [35, 45, 85], (x, y) => shirt(x - 12, y - 12) && !shirt(x, y)), "cut"],
  ["Schwarzes Shirt bis zum Bildrand auf Laken", img(sheet, shirtFull, () => [30, 30, 32]), "cut"],
  ["Jeans auf grauem Boden mit Verlauf", img(floor, jeans, (x, y) => [60, 85, 140 + Math.sin(y * 0.2) * 10]), "cut"],
  ["Brauner Schuh auf hellem Boden", img(sheet, shoe, () => [110, 70, 40]), "cut"],
  ["Weißes Hemd auf dunklem Boden", img(dark, shirt, () => [238, 238, 240]), "cut"],
  ["Bunter, unruhiger Hintergrund", img(busy, shirt, () => [35, 45, 85]), "reject"],
  // Beige Hose vor beiger Wand (Fehler aus der Praxis): Teil und Hintergrund fast gleich -> verwerfen statt Fetzen
  ["Beige Hose vor beiger Wand", img((x, y) => { const s = (rnd() - 0.5) * 6; return [176 + s, 160 + s, 135 + s]; }, jeans, (x, y) => [172 + (x % 40 < 3 ? -40 : 0), 156 + (x % 40 < 3 ? -40 : 0), 131], undefined), "reject"],
];


  for (const [name, { px, gt }, expected] of cases as [string, { px: Uint8ClampedArray; gt: Uint8Array }, string][]) {
    it(`${name} (${expected})`, () => {
      const r = computeMask(px, W, H, 1);
      if (expected === "reject") { expect(r.ok).toBe(false); return; }
      expect(r.ok).toBe(true); if (!r.ok) return;
      let inter = 0, uni = 0;
      for (let i = 0; i < W * H; i++) { if (r.mask[i] && gt[i]) inter++; if (r.mask[i] || gt[i]) uni++; }
      expect(inter / uni).toBeGreaterThanOrEqual(0.9);
    });
  }
});
