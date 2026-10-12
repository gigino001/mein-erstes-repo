import type { Point } from "@pv-dachplaner/geometry-core";
import type { Utm } from "./coords";
import type { StringGruppe, Bereich } from "./strings";

/** Dachfläche (eben). Umriss in EPSG:25832, Meter, Draufsicht. */
export interface RoofPlane {
  id: string;
  name: string;
  outline: Point[];
  /** Neigung in Grad; null = noch nicht angegeben (Ergebnis zeigt dann „Neigung fehlt“). */
  slopeDeg: number | null;
  /** Fallrichtung in Kompassgrad (0 = N, 180 = S); null = noch nicht angegeben. */
  azimuthDeg: number | null;
  quelle: "manuell" | "lod2";
  /** Gleich lange Strings dieser Dachfläche; null = noch nicht verstringt */
  stringGruppen?: StringGruppe[] | null;
}

export type ObstacleArt = "kamin" | "dachfenster" | "gaube" | "antenne" | "luefter" | "sonstiges";

export interface Obstacle {
  id: string;
  art: ObstacleArt;
  outline: Point[];
  bufferM: number;
  abziehen: boolean;
}

export type Ausrichtung = "hochkant" | "quer" | "beste";

export interface ProjectSettings {
  /** Randabstand in Metern: 0 = aus, 0.2 = Standard, 0.1 = knapp */
  randabstandM: 0 | 0.1 | 0.2;
  orientation: Ausrichtung;
  /** Zulässige Stringlänge (aus Modul- und Wechselrichterdaten); null = ungeprüft */
  stringBereich: Bereich | null;
  /** gewähltes Modul / gewählter Wechselrichter aus der Geräteliste (leitet den Bereich ab) */
  modulId?: string | null;
  wechselrichterId?: string | null;
}

export interface Project {
  id: string;
  name: string;
  kunde: { name: string; notiz: string };
  adresse: { text: string; position: Utm | null };
  /** Wer das Projekt bearbeitet hat (erscheint im PDF) */
  bearbeiter: string;
  /** Befliegungsdatum des Luftbilds (JJJJ-MM-TT), falls bekannt */
  imageDate: string | null;
  created: string;
  updated: string;
  /** Zählt Änderungen; Grundlage für die Konflikterkennung in M3 */
  version: number;
  roofs: RoofPlane[];
  obstacles: Obstacle[];
  settings: ProjectSettings;
}

export const SCHEMA_VERSION = 1;

export function neuesProjekt(partial: Partial<Pick<Project, "name" | "adresse" | "imageDate">> = {}, jetzt = new Date()): Project {
  const iso = jetzt.toISOString();
  return {
    id: crypto.randomUUID(),
    name: partial.name ?? "Neues Projekt",
    kunde: { name: "", notiz: "" },
    adresse: partial.adresse ?? { text: "", position: null },
    imageDate: partial.imageDate ?? null,
    created: iso,
    updated: iso,
    version: 1,
    roofs: [],
    obstacles: [],
    bearbeiter: "",
    settings: { randabstandM: 0, orientation: "hochkant", stringBereich: null },
  };
}

// ---------- Prüfung beim Import ----------

function pruefeGruppen(v: unknown): StringGruppe[] | null {
  if (!Array.isArray(v)) return null;
  const out: StringGruppe[] = [];
  for (const x of v) {
    if (typeof x !== "object" || x === null) continue;
    const { laenge, anzahl } = x as Record<string, unknown>;
    if (typeof laenge === "number" && typeof anzahl === "number" && Number.isInteger(laenge) && Number.isInteger(anzahl) && laenge >= 1 && laenge <= 60 && anzahl >= 1 && anzahl <= 200) out.push({ laenge, anzahl });
  }
  return out.length > 0 ? out : null;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";

function pruefePunkte(v: unknown, was: string): Point[] {
  if (!Array.isArray(v) || v.length < 3) throw new Error(`${was}: mindestens 3 Punkte nötig`);
  return v.map((p, i) => {
    if (!isObj(p) || !isNum(p.x) || !isNum(p.y)) throw new Error(`${was}: Punkt ${i + 1} ungültig`);
    return { x: p.x, y: p.y };
  });
}

/** Prüft ein unbekanntes Objekt und liefert ein bereinigtes Projekt oder wirft einen Fehler mit deutscher Meldung. */
export function pruefeProjekt(v: unknown): Project {
  if (!isObj(v)) throw new Error("Projekt ist kein Objekt");
  if (!isStr(v.id) || v.id.length < 8) throw new Error("Projekt: Kennung fehlt");
  if (!isStr(v.name)) throw new Error("Projekt: Name fehlt");
  if (!isStr(v.created) || !isStr(v.updated)) throw new Error("Projekt: Zeitangaben fehlen");
  const kunde = isObj(v.kunde) ? v.kunde : {};
  const adr = isObj(v.adresse) ? v.adresse : {};
  const pos = isObj(adr.position) && isNum(adr.position.e) && isNum(adr.position.n) ? { e: adr.position.e, n: adr.position.n } : null;
  const settings = isObj(v.settings) ? v.settings : {};
  const rand = settings.randabstandM === 0.1 || settings.randabstandM === 0.2 ? settings.randabstandM : 0;
  const ori = settings.orientation === "quer" || settings.orientation === "beste" ? settings.orientation : "hochkant";
  const roofs = (Array.isArray(v.roofs) ? v.roofs : []).map((r, i): RoofPlane => {
    if (!isObj(r) || !isStr(r.id)) throw new Error(`Dachfläche ${i + 1}: Kennung fehlt`);
    const slope = r.slopeDeg === null || r.slopeDeg === undefined ? null : r.slopeDeg;
    const az = r.azimuthDeg === null || r.azimuthDeg === undefined ? null : r.azimuthDeg;
    if (slope !== null && (!isNum(slope) || slope < 0 || slope >= 90)) throw new Error(`Dachfläche ${i + 1}: Neigung ungültig`);
    if (az !== null && !isNum(az)) throw new Error(`Dachfläche ${i + 1}: Ausrichtung ungültig`);
    return {
      id: r.id,
      name: isStr(r.name) ? r.name : `D${i + 1}`,
      outline: pruefePunkte(r.outline, `Dachfläche ${i + 1}`),
      slopeDeg: slope,
      azimuthDeg: az,
      quelle: r.quelle === "lod2" ? "lod2" : "manuell",
      ...(pruefeGruppen(r.stringGruppen) ? { stringGruppen: pruefeGruppen(r.stringGruppen) } : {}),
    };
  });
  const arten: ObstacleArt[] = ["kamin", "dachfenster", "gaube", "antenne", "luefter", "sonstiges"];
  const obstacles = (Array.isArray(v.obstacles) ? v.obstacles : []).map((o, i): Obstacle => {
    if (!isObj(o) || !isStr(o.id)) throw new Error(`Hindernis ${i + 1}: Kennung fehlt`);
    return {
      id: o.id,
      art: arten.includes(o.art as ObstacleArt) ? (o.art as ObstacleArt) : "sonstiges",
      outline: pruefePunkte(o.outline, `Hindernis ${i + 1}`),
      bufferM: isNum(o.bufferM) && o.bufferM >= 0 ? o.bufferM : 0,
      abziehen: o.abziehen !== false,
    };
  });
  const sb = isObj(settings.stringBereich) && isNum(settings.stringBereich.min) && isNum(settings.stringBereich.max) && settings.stringBereich.min >= 1 && settings.stringBereich.max >= settings.stringBereich.min && settings.stringBereich.max <= 60
    ? { min: Math.floor(settings.stringBereich.min), max: Math.floor(settings.stringBereich.max) }
    : null;
  return {
    id: v.id,
    name: v.name,
    bearbeiter: isStr(v.bearbeiter) ? v.bearbeiter : "",
    kunde: { name: isStr(kunde.name) ? kunde.name : "", notiz: isStr(kunde.notiz) ? kunde.notiz : "" },
    adresse: { text: isStr(adr.text) ? adr.text : "", position: pos },
    imageDate: isStr(v.imageDate) ? v.imageDate : null,
    created: v.created,
    updated: v.updated,
    version: isNum(v.version) ? v.version : 1,
    roofs,
    obstacles,
    settings: {
      randabstandM: rand,
      orientation: ori,
      stringBereich: sb,
      ...(isStr(settings.modulId) ? { modulId: settings.modulId } : {}),
      ...(isStr(settings.wechselrichterId) ? { wechselrichterId: settings.wechselrichterId } : {}),
    },
  };
}
