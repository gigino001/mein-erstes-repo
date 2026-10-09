import type { Point } from "@pv-dachplaner/geometry-core";
import { abstand } from "./geom";

export interface EinrastErgebnis {
  punkt: Point;
  art: "ecke" | "kante";
}

/** Nächster Punkt auf der Strecke ab (begrenzt auf die Strecke). */
export function lotfusspunkt(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return { ...a };
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

/**
 * Rastet einen Punkt an eine Ecke oder Kante ein. Ecken haben Vorrang. `schwelle` in Metern.
 * Kanten rasten nur bei 70 % der Schwelle ein, damit man sich leichter davon lösen kann.
 */
export function einrasten(p: Point, ecken: Point[], kanten: [Point, Point][], schwelle: number): EinrastErgebnis | null {
  let beste: Point | null = null;
  let d = schwelle;
  for (const e of ecken) {
    const x = abstand(p, e);
    if (x <= d) {
      d = x;
      beste = e;
    }
  }
  if (beste) return { punkt: { ...beste }, art: "ecke" };
  d = schwelle * 0.7;
  let kante: Point | null = null;
  for (const [a, b] of kanten) {
    const f = lotfusspunkt(p, a, b);
    const x = abstand(p, f);
    if (x <= d) {
      d = x;
      kante = f;
    }
  }
  return kante ? { punkt: kante, art: "kante" } : null;
}
