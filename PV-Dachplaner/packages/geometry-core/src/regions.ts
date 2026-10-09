import ClipperLib from "clipper-lib";
import type { Paths } from "clipper-lib";

/**
 * Flächenoperationen auf Basis von Clipper (ganzzahlig, daher unempfindlich gegen Rundungsfehler).
 * Koordinaten in Metern werden mit SCALE auf ganze Zahlen (0,1 mm) abgebildet.
 */
const SCALE = 1e4;
/** Genauigkeit des Rundschnitts an Innenecken, in Rasterschritten (5 = 0,5 mm). */
const ARC_TOLERANCE = 5;

export type Pair = [number, number];
/** Gebiet als Liste von Ringen. Äußere Ringe und Löcher unterscheiden sich über die Orientierung (Clipper-Konvention). */
export type Shape = Paths;

const { Clipper, ClipperOffset, PolyType, ClipType, PolyFillType, JoinType, EndType } = ClipperLib;

function exec(clipType: number, subject: Shape, clip: Shape): Shape {
  const c = new Clipper();
  c.AddPaths(subject, PolyType.ptSubject, true);
  if (clip.length > 0) c.AddPaths(clip, PolyType.ptClip, true);
  const out: Shape = [];
  c.Execute(clipType, out, PolyFillType.pftNonZero, PolyFillType.pftNonZero);
  return out;
}

export function ringToShape(ring: Pair[]): Shape {
  const path = ring.map(([x, y]) => ({ X: Math.round(x * SCALE), Y: Math.round(y * SCALE) }));
  // Union mit NonZero löst Selbstüberschneidungen und uneinheitliche Orientierung auf
  return exec(ClipType.ctUnion, [path], []);
}

/** Nettofläche in m²: äußere Ringe plus, Löcher minus. */
export function area(shape: Shape): number {
  let total = 0;
  for (const p of shape) total += Clipper.Area(p);
  return Math.abs(total) / (SCALE * SCALE);
}

export function isEmpty(shape: Shape): boolean {
  return shape.length === 0;
}

function offset(shape: Shape, deltaM: number): Shape {
  const co = new ClipperOffset(2, ARC_TOLERANCE);
  co.AddPaths(shape, JoinType.jtRound, EndType.etClosedPolygon);
  const out: Shape = [];
  co.Execute(out, deltaM * SCALE);
  return out;
}

/** Alle Punkte, die mindestens r von jeder Randkante entfernt liegen (Ecken innen bleiben scharf). */
export function erode(shape: Shape, r: number): Shape {
  if (r <= 0 || shape.length === 0) return shape;
  return offset(shape, -r);
}

/** Gebiet plus Pufferstreifen von r um den Rand. */
export function dilate(shape: Shape, r: number): Shape {
  if (r <= 0 || shape.length === 0) return shape;
  return offset(shape, r);
}

export function unionAll(shapes: Shape[]): Shape {
  const all: Shape = shapes.flat();
  if (all.length === 0) return all;
  return exec(ClipType.ctUnion, all, []);
}

export function intersect(a: Shape, b: Shape): Shape {
  if (a.length === 0 || b.length === 0) return [];
  return exec(ClipType.ctIntersection, a, b);
}

export function subtract(a: Shape, b: Shape): Shape {
  if (a.length === 0) return [];
  if (b.length === 0) return a;
  return exec(ClipType.ctDifference, a, b);
}

/** Zellgröße des räumlichen Index in Metern. */
const CELL = 0.5;

/** Zugriff für das Raster: Kantenliste (in Metern) mit räumlichem Index, Punkt-in-Gebiet- und Rechtecktest. */
export class Region {
  readonly segs: Float64Array;
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
  private readonly nx: number;
  private readonly ny: number;
  /** Zellen: Kanten, deren Umschließung die Zelle berührt. */
  private readonly cells: number[][];
  /** Zeilenbänder: Kanten, die das Band in y-Richtung berühren (jede Kante höchstens einmal je Band). */
  private readonly rows: number[][];

  constructor(shape: Shape) {
    const list: number[] = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const path of shape) {
      const n = path.length;
      for (let i = 0; i < n; i++) {
        const a = path[i]!;
        const b = path[(i + 1) % n]!;
        const x1 = a.X / SCALE, y1 = a.Y / SCALE, x2 = b.X / SCALE, y2 = b.Y / SCALE;
        list.push(x1, y1, x2, y2);
        minX = Math.min(minX, x1, x2);
        maxX = Math.max(maxX, x1, x2);
        minY = Math.min(minY, y1, y2);
        maxY = Math.max(maxY, y1, y2);
      }
    }
    this.segs = Float64Array.from(list);
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    const empty = list.length === 0;
    this.nx = empty ? 0 : Math.floor((maxX - minX) / CELL) + 1;
    this.ny = empty ? 0 : Math.floor((maxY - minY) / CELL) + 1;
    this.cells = Array.from({ length: this.nx * this.ny }, () => []);
    this.rows = Array.from({ length: this.ny }, () => []);
    for (let i = 0; i < list.length; i += 4) {
      const k = i / 4;
      const sx0 = Math.min(list[i]!, list[i + 2]!), sx1 = Math.max(list[i]!, list[i + 2]!);
      const sy0 = Math.min(list[i + 1]!, list[i + 3]!), sy1 = Math.max(list[i + 1]!, list[i + 3]!);
      const cx0 = this.cx(sx0), cx1 = this.cx(sx1), cy0 = this.cy(sy0), cy1 = this.cy(sy1);
      for (let cy = cy0; cy <= cy1; cy++) {
        this.rows[cy]!.push(k);
        for (let cx = cx0; cx <= cx1; cx++) this.cells[cy * this.nx + cx]!.push(k);
      }
    }
  }

  private cx(x: number): number {
    return Math.min(this.nx - 1, Math.max(0, Math.floor((x - this.minX) / CELL)));
  }
  private cy(y: number): number {
    return Math.min(this.ny - 1, Math.max(0, Math.floor((y - this.minY) / CELL)));
  }

  get isEmpty(): boolean {
    return this.segs.length === 0;
  }

  /** Gerade-ungerade-Regel über alle Ringe (Löcher inklusive); nur Kanten im Zeilenband werden geprüft. */
  contains(x: number, y: number): boolean {
    if (this.isEmpty || x < this.minX || x > this.maxX || y < this.minY || y > this.maxY) return false;
    const s = this.segs;
    let inside = false;
    for (const k of this.rows[this.cy(y)]!) {
      const i = k * 4;
      const x1 = s[i]!, y1 = s[i + 1]!, x2 = s[i + 2]!, y2 = s[i + 3]!;
      if ((y1 > y) !== (y2 > y)) {
        const xAt = x1 + ((y - y1) * (x2 - x1)) / (y2 - y1);
        if (x < xAt) inside = !inside;
      }
    }
    return inside;
  }

  /**
   * Liegt das Rechteck vollständig im Gebiet? Berühren des Rands ist erlaubt.
   * Prüft: keine Randkante durchquert das (minimal verkleinerte) Rechteck und der Mittelpunkt liegt innen.
   */
  containsRect(x0: number, y0: number, x1: number, y1: number): boolean {
    if (this.isEmpty || x0 < this.minX - 1e-9 || x1 > this.maxX + 1e-9 || y0 < this.minY - 1e-9 || y1 > this.maxY + 1e-9) {
      return false;
    }
    // Toleranz: Ganzzahl-Raster (0,1 mm) darf ein bündig anliegendes Modul nicht ausschließen
    const eps = 2 / SCALE;
    const a0 = x0 + eps, b0 = y0 + eps, a1 = x1 - eps, b1 = y1 - eps;
    const s = this.segs;
    const cx0 = this.cx(a0), cx1 = this.cx(a1), cy0 = this.cy(b0), cy1 = this.cy(b1);
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        for (const k of this.cells[cy * this.nx + cx]!) {
          const i = k * 4;
          if (segmentHitsRect(s[i]!, s[i + 1]!, s[i + 2]!, s[i + 3]!, a0, b0, a1, b1)) return false;
        }
      }
    }
    return this.contains((x0 + x1) / 2, (y0 + y1) / 2);
  }
}

/** Liang-Barsky: schneidet die Strecke das abgeschlossene Rechteck? */
function segmentHitsRect(
  x1: number, y1: number, x2: number, y2: number,
  rx0: number, ry0: number, rx1: number, ry1: number,
): boolean {
  if ((x1 < rx0 && x2 < rx0) || (x1 > rx1 && x2 > rx1) || (y1 < ry0 && y2 < ry0) || (y1 > ry1 && y2 > ry1)) {
    return false;
  }
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rx0, rx1 - x1, y1 - ry0, ry1 - y1];
  for (let k = 0; k < 4; k++) {
    const pk = p[k]!, qk = q[k]!;
    if (pk === 0) {
      if (qk < 0) return false;
    } else {
      const t = qk / pk;
      if (pk < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t0 <= t1;
}
