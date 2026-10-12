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

/**
 * Fallrichtung (Kompassgrad, 0 = Nord, 90 = Ost) für die Kante `i` als Traufkante: Richtung der nach außen zeigenden Kantennormale.
 * Das Dach fällt zur Traufe hin ab.
 */
export function ausrichtungVonKante(ring: Point[], i: number): number {
  const a = ring[i]!;
  const b = ring[(i + 1) % ring.length]!;
  const dx = b.x - a.x, dy = b.y - a.y;
  const l = Math.hypot(dx, dy);
  if (l === 0) return 0;
  const mitte = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const eps = Math.min(0.05, l * 0.01);
  let nx = dy / l, ny = -dx / l;
  if (punktInVieleck({ x: mitte.x + nx * eps, y: mitte.y + ny * eps }, ring)) {
    nx = -nx;
    ny = -ny;
  }
  return (Math.round(((Math.atan2(nx, ny) * 180) / Math.PI + 360) * 10) / 10) % 360;
}

/** Nächste Kante zu einem Punkt: Index und Abstand. */
export function naechsteKante(ring: Point[], p: Point): { index: number; abstand: number } {
  let best = { index: 0, abstand: Infinity };
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length]!;
    const dx = b.x - a.x, dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    const d = Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
    if (d < best.abstand) best = { index: i, abstand: d };
  });
  return best;
}

export function schwerpunkt(ring: Point[]): Point {
  const n = ring.length || 1;
  return { x: ring.reduce((a, q) => a + q.x, 0) / n, y: ring.reduce((a, q) => a + q.y, 0) / n };
}

/** Dreht ein Vieleck um `mitte` (Grad, gegen den Uhrzeigersinn bei y nach Norden). */
export function drehen(ring: Point[], mitte: Point, grad: number): Point[] {
  const t = (grad * Math.PI) / 180;
  const c = Math.cos(t), s = Math.sin(t);
  return ring.map((q) => ({ x: mitte.x + (q.x - mitte.x) * c - (q.y - mitte.y) * s, y: mitte.y + (q.x - mitte.x) * s + (q.y - mitte.y) * c }));
}

/** Rechteck aus zwei gegenüberliegenden Ecken in einem um `winkelRad` gedrehten Achsensystem. */
export function rechteckAusDiagonale(a: Point, b: Point, winkelRad: number): Point[] {
  const ex = Math.cos(winkelRad), ey = Math.sin(winkelRad);
  const dx = b.x - a.x, dy = b.y - a.y;
  const u = dx * ex + dy * ey; // Anteil entlang der Achse
  const v = -dx * ey + dy * ex; // Anteil senkrecht dazu
  return [
    { x: a.x, y: a.y },
    { x: a.x + u * ex, y: a.y + u * ey },
    { x: b.x, y: b.y },
    { x: a.x - v * ey, y: a.y + v * ex },
  ];
}

/** Richtung der Kante i in Bogenmaß (von Punkt i zu Punkt i+1). */
export function kantenWinkel(ring: Point[], i: number): number {
  const a = ring[i]!;
  const b = ring[(i + 1) % ring.length]!;
  return Math.atan2(b.y - a.y, b.x - a.x);
}
