/** Punkt in Metern. Im Dachplan (Draufsicht): x = Ost, y = Nord. */
export interface Point {
  x: number;
  y: number;
}

/** Einfacher Ring ohne wiederholten Startpunkt. */
export type Ring = Point[];

export interface ModuleType {
  /** Kurze Kante in Metern (Fuge bereits enthalten). */
  widthM: number;
  /** Lange Kante in Metern. */
  heightM: number;
  powerWp: number;
}

export const DEFAULT_MODULE: ModuleType = { widthM: 1.15, heightM: 1.78, powerWp: 460 };

/** hochkant = lange Kante entlang des Gefälles, quer = lange Kante entlang der Traufe. */
export type Orientation = "hochkant" | "quer";

export interface RoofPlaneInput {
  /** Umriss in der Draufsicht (Meter). */
  outline: Ring;
  /** Dachneigung in Grad, 0 <= slope < 90. */
  slopeDeg: number;
  /** Richtung, in die die Fläche abfällt, Kompassgrad (0 = N, 90 = O, 180 = S). */
  azimuthDeg: number;
}

export interface ObstacleInput {
  /** Umriss in der Draufsicht (Meter). */
  outline: Ring;
  /** Zusätzlicher Abstand um das Hindernis in Metern (in der Dachebene). */
  bufferM?: number;
  /** false = nur zur Information, wird nicht abgezogen. Standard: true. */
  subtract?: boolean;
}

export interface LayoutOptions {
  module?: ModuleType;
  /** Randabstand zu allen Dachkanten in Metern. Standard 0 (aus). */
  edgeMarginM?: number;
  /** Abstand zwischen Modulen in Metern. Standard 0 (Fuge steckt in den Modulmaßen). */
  gapM?: number;
  /** Schrittweite der Rastersuche in Metern. Standard 0.05. */
  stepM?: number;
  /** Ausrichtung; "beste" wählt die mit mehr Modulen (bei Gleichstand hochkant). Standard "hochkant". */
  orientation?: Orientation | "beste";
}

export interface PlacedModule {
  /** Ecken in der Draufsicht (Meter), gegen den Uhrzeigersinn. */
  corners: Ring;
  /** Linke untere Ecke in Dachebenen-Koordinaten (u entlang der Traufe, v entlang des Gefälles). */
  u: number;
  v: number;
}

export interface OrientationResult {
  orientation: Orientation;
  count: number;
  modules: PlacedModule[];
}

export interface LayoutResult {
  /** Dachfläche (Schrägfläche) in m². */
  grossAreaM2: number;
  /** Durch den Randabstand verlorene Fläche in m². */
  marginLossM2: number;
  /** Durch Hindernisse verlorene Fläche (ohne Doppelzählung mit dem Rand) in m². */
  obstacleLossM2: number;
  /** Nutzbare Fläche in m². */
  usableAreaM2: number;
  orientation: Orientation;
  moduleCount: number;
  moduleAreaM2: number;
  powerKWp: number;
  modules: PlacedModule[];
  /** Ergebnisse beider Ausrichtungen, hochkant zuerst. */
  alternatives: OrientationResult[];
  warnings: string[];
}
