import { describe, expect, it } from "vitest";
import { computeLayout, type ObstacleInput, type Ring } from "../src";
import { rect, rotate } from "./helpers";

/** Deterministischer Zufall, damit Fehlschläge reproduzierbar sind. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomRoof(r: () => number): Ring {
  const w = 4 + r() * 14;
  const h = 3 + r() * 9;
  const kind = Math.floor(r() * 4);
  const base: Ring =
    kind === 0
      ? rect(0, 0, w, h)
      : kind === 1
        ? [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w * (0.5 + r() * 0.3), y: h }]
        : kind === 2
          ? [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w - r() * w * 0.3, y: h }, { x: r() * w * 0.3, y: h }]
          : [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h * 0.4 }, { x: w * 0.4, y: h * 0.4 }, { x: w * 0.4, y: h }, { x: 0, y: h }];
  const ox = 1000 * r();
  const oy = 1000 * r();
  return rotate(base, r() * 360).map((p) => ({ x: p.x + ox, y: p.y + oy }));
}

describe("Zufallstest: kein Absturz, Invarianten gelten", () => {
  it("300 zufällige Dächer", { timeout: 120_000 }, () => {
    const r = rng(12345);
    let maxMs = 0;
    for (let i = 0; i < 300; i++) {
      const outline = randomRoof(r);
      const cx = outline.reduce((a, p) => a + p.x, 0) / outline.length;
      const cy = outline.reduce((a, p) => a + p.y, 0) / outline.length;
      const obstacles: ObstacleInput[] = [];
      const nObs = Math.floor(r() * 4);
      for (let k = 0; k < nObs; k++) {
        const ox = cx + (r() - 0.5) * 6;
        const oy = cy + (r() - 0.5) * 4;
        obstacles.push({
          outline: rotate(rect(0, 0, 0.4 + r() * 1.5, 0.4 + r() * 1.5), r() * 360).map((p) => ({ x: p.x + ox, y: p.y + oy })),
          bufferM: r() < 0.5 ? 0 : 0.2,
        });
      }
      const opts = { edgeMarginM: [0, 0.1, 0.2][Math.floor(r() * 3)]!, orientation: "beste" as const };
      const roof = { outline, slopeDeg: r() * 60, azimuthDeg: r() * 360 };
      const t0 = performance.now();
      let res;
      try {
        res = computeLayout(roof, obstacles, opts);
      } catch (e) {
        throw new Error(`Fall ${i} fehlgeschlagen: ${(e as Error).message}\n${JSON.stringify({ roof, obstacles, opts })}`);
      }
      const dt = performance.now() - t0;
      if (dt > 1000) console.log(`langsam: Fall ${i} ${dt.toFixed(0)} ms`);
      maxMs = Math.max(maxMs, dt);
      expect(res.usableAreaM2).toBeLessThanOrEqual(res.grossAreaM2 + 1e-6);
      expect(res.moduleAreaM2).toBeLessThanOrEqual(res.usableAreaM2 + 1e-6);
      expect(res.marginLossM2 + res.obstacleLossM2 + res.usableAreaM2).toBeCloseTo(res.grossAreaM2, 2);
    }
    expect(maxMs, `längste Berechnung ${maxMs.toFixed(0)} ms`).toBeLessThan(1000);
  });
});
