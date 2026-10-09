import type { Point, RoofPlaneInput } from "./types";

const DEG = Math.PI / 180;

export function validatePlane(plane: RoofPlaneInput): void {
  const { slopeDeg, azimuthDeg, outline } = plane;
  if (!Number.isFinite(slopeDeg) || slopeDeg < 0 || slopeDeg >= 90) {
    throw new RangeError(`Dachneigung muss im Bereich 0 bis unter 90 Grad liegen, war ${slopeDeg}`);
  }
  if (!Number.isFinite(azimuthDeg)) {
    throw new RangeError(`Ausrichtung ungültig: ${azimuthDeg}`);
  }
  if (outline.length < 3) {
    throw new RangeError("Ein Dachumriss braucht mindestens 3 Punkte");
  }
}

/**
 * Abbildung zwischen Draufsicht (x Ost, y Nord, Meter) und Dachebene.
 * u läuft entlang der Traufe, v entlang des Gefälles in wahrer Länge (talwärts positiv).
 * Die Fläche in der Dachebene ist deshalb die Schrägfläche: A_schräg = A_Grundriss / cos(Neigung).
 */
export class RoofFrame {
  private readonly ex: number;
  private readonly ey: number;
  private readonly dx: number;
  private readonly dy: number;
  private readonly cosSlope: number;

  constructor(slopeDeg: number, azimuthDeg: number) {
    const az = azimuthDeg * DEG;
    this.dx = Math.sin(az);
    this.dy = Math.cos(az);
    this.ex = Math.cos(az);
    this.ey = -Math.sin(az);
    this.cosSlope = Math.cos(slopeDeg * DEG);
  }

  toPlane(p: Point): [number, number] {
    const u = p.x * this.ex + p.y * this.ey;
    const w = p.x * this.dx + p.y * this.dy;
    return [u, w / this.cosSlope];
  }

  toPlan(u: number, v: number): Point {
    const w = v * this.cosSlope;
    return { x: u * this.ex + w * this.dx, y: u * this.ey + w * this.dy };
  }
}
