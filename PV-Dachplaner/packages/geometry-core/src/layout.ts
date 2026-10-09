import {
  DEFAULT_MODULE,
  type LayoutOptions,
  type LayoutResult,
  type ObstacleInput,
  type Orientation,
  type OrientationResult,
  type PlacedModule,
  type Point,
  type RoofPlaneInput,
} from "./types";
import { RoofFrame, validatePlane } from "./plane";
import { Region, area, dilate, erode, intersect, ringToShape, subtract, unionAll, type Pair, type Shape } from "./regions";

function ringToPlane(frame: RoofFrame, ring: Point[], origin: Point): Pair[] {
  return ring.map((p) => frame.toPlane({ x: p.x - origin.x, y: p.y - origin.y }));
}

/**
 * Berechnet Dachfläche, nutzbare Fläche und Modulbelegung für eine ebene Dachfläche.
 * Alle Abzüge und das Modulraster liegen in der Dachebene (wahre Längen).
 */
export function computeLayout(
  roof: RoofPlaneInput,
  obstacles: ObstacleInput[] = [],
  options: LayoutOptions = {},
): LayoutResult {
  validatePlane(roof);
  const module = options.module ?? DEFAULT_MODULE;
  const margin = options.edgeMarginM ?? 0;
  const gap = options.gapM ?? 0;
  const step = options.stepM ?? 0.05;
  const mode = options.orientation ?? "hochkant";
  if (margin < 0 || gap < 0 || step <= 0) throw new RangeError("Randabstand, Fuge und Schrittweite müssen positiv sein");

  // Rechnen um einen lokalen Ursprung: UTM-Koordinaten (Millionen Meter) würden die Genauigkeit zerstören.
  const origin: Point = {
    x: roof.outline.reduce((a, p) => a + p.x, 0) / roof.outline.length,
    y: roof.outline.reduce((a, p) => a + p.y, 0) / roof.outline.length,
  };
  const frame = new RoofFrame(roof.slopeDeg, roof.azimuthDeg);
  const warnings: string[] = [];
  if (roof.slopeDeg > 70) warnings.push("Dachneigung über 70°: bitte prüfen");

  const outline = ringToShape(ringToPlane(frame, roof.outline, origin));
  const grossArea = area(outline);

  const inset = erode(outline, margin);
  const marginLoss = grossArea - area(inset);

  const blockers: Shape[] = [];
  for (const ob of obstacles) {
    if (ob.subtract === false) continue;
    if (ob.outline.length < 3) throw new RangeError("Ein Hindernis braucht mindestens 3 Punkte");
    blockers.push(dilate(ringToShape(ringToPlane(frame, ob.outline, origin)), ob.bufferM ?? 0));
  }
  const blocked = unionAll(blockers);
  const obstacleLoss = area(intersect(inset, blocked));
  const usable = subtract(inset, blocked);
  const usableArea = area(usable);

  const region = new Region(usable);
  const alternatives: OrientationResult[] = (["hochkant", "quer"] as Orientation[]).map((o) =>
    packModules(region, frame, origin, module.widthM, module.heightM, gap, step, o),
  );

  const chosen =
    mode === "beste"
      ? alternatives.reduce((best, cur) => (cur.count > best.count ? cur : best))
      : alternatives.find((a) => a.orientation === mode)!;

  return {
    grossAreaM2: grossArea,
    marginLossM2: marginLoss,
    obstacleLossM2: obstacleLoss,
    usableAreaM2: usableArea,
    orientation: chosen.orientation,
    moduleCount: chosen.count,
    moduleAreaM2: chosen.count * module.widthM * module.heightM,
    powerKWp: (chosen.count * module.powerWp) / 1000,
    modules: chosen.modules,
    alternatives,
    warnings,
  };
}

/** Mögliche Rasterversätze: gleichmäßig verteilt plus bündig zu den Rändern des Gebiets. */
function offsets(pitch: number, step: number, lo: number, hi: number): number[] {
  const set = new Set<number>();
  const norm = (x: number) => {
    const m = x % pitch;
    return Math.round((m < 0 ? m + pitch : m) * 1e9) / 1e9;
  };
  for (let o = 0; o < pitch; o += step) set.add(norm(o));
  set.add(norm(lo));
  set.add(norm(hi));
  return [...set];
}

function packModules(
  region: Region,
  frame: RoofFrame,
  origin: Point,
  widthM: number,
  heightM: number,
  gap: number,
  step: number,
  orientation: Orientation,
): OrientationResult {
  // hochkant: lange Kante (heightM) entlang des Gefälles (v), kurze Kante entlang der Traufe (u)
  const mu = orientation === "hochkant" ? widthM : heightM;
  const mv = orientation === "hochkant" ? heightM : widthM;
  if (region.isEmpty) return { orientation, count: 0, modules: [] };

  const pu = mu + gap;
  const pv = mv + gap;
  const offU = offsets(pu, step, region.minX, region.maxX - mu);
  const offV = offsets(pv, step, region.minY, region.maxY - mv);

  let bestCount = 0;
  let bestU = 0;
  let bestV = 0;
  for (const ou of offU) {
    for (const ov of offV) {
      const n = countAt(region, mu, mv, pu, pv, ou, ov, bestCount);
      if (n > bestCount) {
        bestCount = n;
        bestU = ou;
        bestV = ov;
      }
    }
  }

  const modules = bestCount > 0 ? collectAt(region, frame, origin, mu, mv, pu, pv, bestU, bestV) : [];
  return { orientation, count: modules.length, modules };
}

function cellRange(lo: number, hi: number, size: number, pitch: number, off: number): [number, number] {
  return [Math.ceil((lo - off) / pitch - 1e-9), Math.floor((hi - size - off) / pitch + 1e-9)];
}

function countAt(region: Region, mu: number, mv: number, pu: number, pv: number, ou: number, ov: number, _best: number): number {
  const [i0, i1] = cellRange(region.minX, region.maxX, mu, pu, ou);
  const [j0, j1] = cellRange(region.minY, region.maxY, mv, pv, ov);
  let n = 0;
  for (let i = i0; i <= i1; i++) {
    const x = ou + i * pu;
    for (let j = j0; j <= j1; j++) {
      const y = ov + j * pv;
      if (region.containsRect(x, y, x + mu, y + mv)) n++;
    }
  }
  return n;
}

function collectAt(
  region: Region, frame: RoofFrame, origin: Point,
  mu: number, mv: number, pu: number, pv: number, ou: number, ov: number,
): PlacedModule[] {
  const [i0, i1] = cellRange(region.minX, region.maxX, mu, pu, ou);
  const [j0, j1] = cellRange(region.minY, region.maxY, mv, pv, ov);
  const out: PlacedModule[] = [];
  for (let i = i0; i <= i1; i++) {
    const u = ou + i * pu;
    for (let j = j0; j <= j1; j++) {
      const v = ov + j * pv;
      if (!region.containsRect(u, v, u + mu, v + mv)) continue;
      out.push({
        u,
        v,
        corners: [frame.toPlan(u, v), frame.toPlan(u + mu, v), frame.toPlan(u + mu, v + mv), frame.toPlan(u, v + mv)].map((c) => ({
          x: c.x + origin.x,
          y: c.y + origin.y,
        })),
      });
    }
  }
  return out;
}
