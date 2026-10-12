import type { Gesamt } from "./berechnung";

/** Ein String: aufeinanderfolgende Module einer Dachfläche in Anschlussreihenfolge. */
export interface StringInfo {
  /** laufende Nummer im Projekt (S1, S2, …) */
  nr: number;
  roofId: string;
  roofName: string;
  /** Indizes der Module in `layout.modules` der Dachfläche, in Reihenfolge der Verkabelung */
  module: number[];
}

export interface StringPlan {
  strings: StringInfo[];
  /** je Dachfläche: Anzahl Module ohne String (nur wenn die Länge 0 ist, sonst immer 0) */
  nichtZugeordnet: number;
  /** Anzahl Strings je Länge, z. B. { 12: 1, 11: 3 } */
  laengen: Record<number, number>;
}

export interface StringOptionen {
  /** Höchstzahl Module je String */
  laenge: number;
  /** true: gleich lange Strings je Dachfläche (45 Module bei höchstens 14 → 12, 11, 11, 11); false: so viele volle wie möglich, Rest zuletzt */
  gleichLang: boolean;
}

/**
 * Reihenfolge der Module einer Dachfläche: Reihen von der Traufe zum First, abwechselnd von links nach rechts und zurück
 * (Schlangenlinie), damit aufeinanderfolgende Module nebeneinander liegen und Kabelwege kurz bleiben.
 * `v` wächst talwärts, die Traufe liegt also bei der größten `v`.
 */
export function reihenfolge(module: { u: number; v: number }[]): number[] {
  const idx = module.map((_, i) => i);
  const reihen = new Map<number, number[]>();
  for (const i of idx) {
    const key = Math.round(module[i]!.v * 100); // gleiche Reihe = gleiche v auf 1 cm genau
    reihen.set(key, [...(reihen.get(key) ?? []), i]);
  }
  const keys = [...reihen.keys()].sort((a, b) => b - a);
  const out: number[] = [];
  keys.forEach((k, r) => {
    const reihe = reihen.get(k)!.sort((a, b) => module[a]!.u - module[b]!.u);
    out.push(...(r % 2 === 0 ? reihe : reihe.reverse()));
  });
  return out;
}

/** Zerlegt `n` Module in Strings mit höchstens `laenge` Modulen. */
export function stringGroessen(n: number, laenge: number, gleichLang: boolean): number[] {
  if (n <= 0 || laenge <= 0) return [];
  if (!gleichLang) {
    const voll = Math.floor(n / laenge);
    const rest = n - voll * laenge;
    return [...Array(voll).fill(laenge), ...(rest > 0 ? [rest] : [])];
  }
  const k = Math.ceil(n / laenge);
  const basis = Math.floor(n / k);
  const mehr = n - basis * k; // so viele Strings bekommen ein Modul mehr
  return Array.from({ length: k }, (_, i) => basis + (i < mehr ? 1 : 0));
}

/** Teilt die Module aller berechneten Dachflächen in Strings ein. Dachflächen werden nie vermischt. */
export function verstringen(g: Gesamt, opt: StringOptionen): StringPlan {
  const strings: StringInfo[] = [];
  const laengen: Record<number, number> = {};
  let nr = 1;
  if (opt.laenge >= 1) {
    for (const d of g.daecher) {
      const modules = d.layout?.modules;
      if (!modules || modules.length === 0) continue;
      const folge = reihenfolge(modules);
      let pos = 0;
      for (const groesse of stringGroessen(folge.length, opt.laenge, opt.gleichLang)) {
        strings.push({ nr: nr++, roofId: d.id, roofName: d.name, module: folge.slice(pos, pos + groesse) });
        laengen[groesse] = (laengen[groesse] ?? 0) + 1;
        pos += groesse;
      }
    }
  }
  return { strings, nichtZugeordnet: 0, laengen };
}

/** Farben für Strings (Okabe-Ito-Palette plus Ergänzungen, gut unterscheidbar auch bei Farbschwäche). */
export const STRING_FARBEN = ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#8DD3C7", "#B15928", "#6A3D9A", "#FB9A99", "#33A02C"];
export const stringFarbe = (nr: number) => STRING_FARBEN[(nr - 1) % STRING_FARBEN.length]!;

/** Kurztext, z. B. „5 Strings: 4 × 11 und 1 × 12 Module“. */
export function stringZusammenfassung(p: StringPlan): string {
  if (p.strings.length === 0) return "keine Strings";
  const teile = Object.entries(p.laengen)
    .map(([l, n]) => ({ l: Number(l), n }))
    .sort((a, b) => b.l - a.l)
    .map((x) => `${x.n} × ${x.l}`);
  return `${p.strings.length} String${p.strings.length === 1 ? "" : "s"}: ${teile.join(" und ")} Module`;
}
