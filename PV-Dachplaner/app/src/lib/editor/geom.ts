import type { Point } from "@pv-dachplaner/geometry-core";

export const abstand = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Fläche des Vielecks (Draufsicht) in m². */
export function flaeche(ring: Point[]): number {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

/** Gerade-ungerade-Regel. */
export function punktInVieleck(p: Point, ring: Point[]): boolean {
  let innen = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) innen = !innen;
  }
  return innen;
}

function ccw(a: Point, b: Point, c: Point) {
  return (c.y - a.y) * (b.x - a.x) - (b.y - a.y) * (c.x - a.x);
}

/** Schneiden sich die Strecken ab und cd (echte Kreuzung, Berühren in einem Endpunkt zählt nicht)? */
function kreuzen(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = ccw(a, b, c), d2 = ccw(a, b, d), d3 = ccw(c, d, a), d4 = ccw(c, d, b);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** Hat das Vieleck sich kreuzende Kanten? */
export function selbstschnitt(ring: Point[]): boolean {
  const n = ring.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue; // benachbarte Kanten teilen einen Punkt
      if (kreuzen(ring[i]!, ring[(i + 1) % n]!, ring[j]!, ring[(j + 1) % n]!)) return true;
    }
  }
  return false;
}

export function punktEinfuegen(ring: Point[], nachIndex: number, p: Point): Point[] {
  const neu = ring.map((q) => ({ ...q }));
  neu.splice(nachIndex + 1, 0, { ...p });
  return neu;
}

/** Entfernt einen Punkt; ein Vieleck behält mindestens 3 Punkte. */
export function punktLoeschen(ring: Point[], index: number): Point[] {
  if (ring.length <= 3) return ring;
  return ring.filter((_, i) => i !== index).map((q) => ({ ...q }));
}

export function verschieben(ring: Point[], dx: number, dy: number): Point[] {
  return ring.map((q) => ({ x: q.x + dx, y: q.y + dy }));
}

export function kantenMitte(ring: Point[], i: number): Point {
  const a = ring[i]!;
  const b = ring[(i + 1) % ring.length]!;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Seitenlängen in Metern (Kante i läuft von Punkt i zu Punkt i+1). */
export function kantenLaengen(ring: Point[]): number[] {
  return ring.map((a, i) => abstand(a, ring[(i + 1) % ring.length]!));
}
