import type { Gesamt } from "./berechnung";

/** Eine Gruppe gleich langer, parallel geschalteter Strings (an einem MPPT-Eingang). */
export interface StringGruppe {
  laenge: number;
  anzahl: number;
}

/** Zulässige Stringlänge (Module je String), z. B. aus Modul- und Wechselrichterdaten. */
export interface Bereich {
  min: number;
  max: number;
}

export const MAX_STRING = 60;

// ---------- Mathematik: Teilbarkeit ----------

/** Stringlängen, die `n` ohne Rest teilen (und im Bereich liegen). Ohne Bereich: 2 bis 60 (bei n = 1 nur 1). */
export function teiler(n: number, b?: Bereich | null): number[] {
  const von = b ? Math.max(1, b.min) : n === 1 ? 1 : 2;
  const bis = b ? Math.min(b.max, MAX_STRING) : MAX_STRING;
  const out: number[] = [];
  for (let l = von; l <= bis && l <= n; l++) if (n % l === 0) out.push(l);
  return out;
}

export const summe = (g: StringGruppe[]) => g.reduce((a, x) => a + x.laenge * x.anzahl, 0);
export const stringZahl = (g: StringGruppe[]) => g.reduce((a, x) => a + x.anzahl, 0);

export function gruppenText(g: StringGruppe[]): string {
  return g.map((x) => `${x.anzahl} × ${x.laenge}`).join(" + ");
}

/** „34 = 2 × 12 + 10“ – zeigt, warum eine Stringlänge nicht aufgeht. */
export function restText(n: number, laenge: number): string {
  const voll = Math.floor(n / laenge);
  const rest = n - voll * laenge;
  return voll === 0 ? `${n} < ${laenge}` : rest === 0 ? `${n} = ${voll} × ${laenge}` : `${n} = ${voll} × ${laenge} + ${rest}`;
}

export interface Versuch {
  ok: boolean;
  gruppen?: StringGruppe[];
  meldung: string;
}

/**
 * Prüft die Eingabe „Module je String“ für eine Dachfläche mit `n` Modulen: Alle Strings einer Gruppe müssen gleich lang sein,
 * die Länge muss die Modulzahl ohne Rest teilen. Sonst wird die Eingabe abgelehnt (mit Begründung).
 */
export function versuchLaenge(n: number, laenge: number, b?: Bereich | null): Versuch {
  if (!Number.isInteger(laenge) || laenge < 1 || laenge > MAX_STRING) return { ok: false, meldung: `Bitte eine ganze Zahl von 1 bis ${MAX_STRING} eingeben.` };
  if (b && (laenge < b.min || laenge > b.max)) {
    return { ok: false, meldung: `${laenge} Module je String liegen außerhalb des zulässigen Bereichs (${b.min} bis ${b.max}).` };
  }
  if (n % laenge !== 0) {
    return { ok: false, meldung: `${n} Module lassen sich nicht in gleich lange Strings mit ${laenge} Modulen teilen (${restText(n, laenge)}).` };
  }
  return { ok: true, gruppen: [{ laenge, anzahl: n / laenge }], meldung: `${n / laenge} × ${laenge} Module` };
}

/** Prüft einen vorhandenen Plan gegen die Modulzahl und den Bereich. */
export function pruefePlan(n: number, g: StringGruppe[], b?: Bereich | null): { ok: boolean; zugeordnet: number; meldungen: string[] } {
  const z = summe(g);
  const meldungen: string[] = [];
  if (z < n) meldungen.push(`${n - z} Modul${n - z === 1 ? "" : "e"} ohne String (${n} Module, ${z} eingeplant).`);
  if (z > n) meldungen.push(`${z - n} Modul${z - n === 1 ? "" : "e"} mehr eingeplant als vorhanden (${n} Module, ${z} eingeplant).`);
  if (b) for (const x of g) if (x.laenge < b.min || x.laenge > b.max) meldungen.push(`Stringlänge ${x.laenge} liegt außerhalb des Bereichs ${b.min} bis ${b.max}.`);
  return { ok: meldungen.length === 0, zugeordnet: z, meldungen };
}

/**
 * Aufteilungen auf zwei Gruppen mit je gleich langen Strings (zwei MPPT-Eingänge), z. B. 34 = 2 × 12 + 1 × 10.
 * Innerhalb einer Gruppe sind alle Strings gleich lang; zwischen den Gruppen dürfen die Längen verschieden sein.
 */
export function zweiGruppen(n: number, b: Bereich, maxStrings = 4, maxAuswahl = 6): StringGruppe[][] {
  const out: { g: StringGruppe[]; verlust: number }[] = [];
  for (let l1 = b.max; l1 >= b.min; l1--) {
    for (let k1 = 1; k1 <= maxStrings && k1 * l1 < n; k1++) {
      const rest = n - k1 * l1;
      for (let l2 = b.max; l2 >= b.min; l2--) {
        if (l2 === l1) continue;
        if (rest % l2 !== 0) continue;
        const k2 = rest / l2;
        if (k2 < 1 || k2 > maxStrings) continue;
        // nur eine Reihenfolge je Paar (längere Strings zuerst)
        if (l2 > l1) continue;
        out.push({ g: [{ laenge: l1, anzahl: k1 }, { laenge: l2, anzahl: k2 }], verlust: Math.abs(l1 - l2) * 10 + k1 + k2 });
      }
    }
  }
  return out.sort((a, b2) => a.verlust - b2.verlust).slice(0, maxAuswahl).map((x) => x.g);
}

/** Nahe Modulzahlen, mit denen sich gleich lange Strings im Bereich bilden lassen (Module entfernen oder ergänzen). */
export function modulAlternativen(n: number, b: Bereich, spanne = 4): { module: number; laenge: number; anzahl: number }[] {
  const out: { module: number; laenge: number; anzahl: number }[] = [];
  for (let d = 1; d <= spanne; d++) {
    for (const m of [n - d, n + d]) {
      if (m < 1) continue;
      const l = teiler(m, b).sort((x, y) => y - x)[0];
      if (l) out.push({ module: m, laenge: l, anzahl: m / l });
    }
  }
  return out;
}

// ---------- Reihenfolge der Module ----------

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

// ---------- Plan aus den Gruppen je Dachfläche ----------

/** Ein String: aufeinanderfolgende Module einer Dachfläche in Anschlussreihenfolge. */
/** Von Hand gelegte Strings einer Dachfläche: Modulindizes (in Verkabelungsreihenfolge) und optional der MPPT-Eingang. */
export interface StringManuell {
  /** Modulzahl der Dachfläche beim Anlegen; weicht sie später ab, ist der Plan veraltet */
  n: number;
  strings: { module: number[]; mppt: number | null }[];
}

export interface StringInfo {
  /** laufende Nummer im Projekt (S1, S2, …) */
  nr: number;
  roofId: string;
  roofName: string;
  /** Gruppe innerhalb der Dachfläche (1, 2, …); Strings einer Gruppe hängen an demselben MPPT */
  gruppe: number;
  /** MPPT-Eingang (nur bei Strings von Hand, sonst null) */
  mppt: number | null;
  /** Indizes der Module in `layout.modules` der Dachfläche, in Reihenfolge der Verkabelung */
  module: number[];
}

export interface DachStrings {
  roofId: string;
  name: string;
  module: number;
  gruppen: StringGruppe[];
  zugeordnet: number;
  ok: boolean;
  meldungen: string[];
  manuell: boolean;
}

export interface StringPlan {
  strings: StringInfo[];
  daecher: DachStrings[];
  /** Anzahl Strings je Länge, z. B. { 12: 1, 11: 3 } */
  laengen: Record<number, number>;
  /** alle Dachflächen mit Strings sind vollständig und im Bereich */
  ok: boolean;
  /** Verstöße gegen „gleich lang je MPPT“ */
  mpptMeldungen: string[];
}

/** Prüft Strings von Hand gegen Modulzahl und Bereich. */
export function pruefeManuell(n: number, m: StringManuell, b?: Bereich | null): string[] {
  const out: string[] = [];
  if (m.n !== n) out.push(`Die Modulbelegung hat sich geändert (beim Anlegen ${m.n} Module, jetzt ${n}). Strings prüfen oder zurücksetzen.`);
  const belegt = new Map<number, number>();
  m.strings.forEach((s, si) => {
    for (const i of s.module) {
      if (i < 0 || i >= n) out.push(`S${si + 1}: Modul ${i + 1} gibt es nicht mehr.`);
      else if (belegt.has(i)) out.push(`Modul ${i + 1} ist in mehreren Strings.`);
      else belegt.set(i, si);
    }
  });
  const frei = n - belegt.size;
  if (frei > 0) out.push(`${frei} Modul${frei === 1 ? "" : "e"} ohne String.`);
  m.strings.forEach((s, si) => {
    if (s.module.length === 0) out.push(`S${si + 1} ist leer.`);
    else if (b && (s.module.length < b.min || s.module.length > b.max)) out.push(`S${si + 1}: ${s.module.length} Module liegen außerhalb des Bereichs ${b.min} bis ${b.max}.`);
  });
  return out;
}

/** Strings an demselben MPPT-Eingang müssen gleich lang sein (gilt über alle Dachflächen). */
export function mpptGleichLang(strings: StringInfo[]): string[] {
  const je = new Map<number, Map<number, string[]>>();
  for (const s of strings) {
    if (s.mppt === null) continue;
    const m = je.get(s.mppt) ?? new Map<number, string[]>();
    m.set(s.module.length, [...(m.get(s.module.length) ?? []), `S${s.nr}`]);
    je.set(s.mppt, m);
  }
  const out: string[] = [];
  for (const [mppt, laengen] of [...je].sort((a, b) => a[0] - b[0])) {
    if (laengen.size > 1) out.push(`MPPT ${mppt}: Strings sind verschieden lang (${[...laengen].map(([l, n]) => `${n.join(", ")} = ${l}`).join("; ")}). An einem MPPT müssen parallele Strings gleich lang sein.`);
  }
  return out;
}

/** Baut die Strings aus den Gruppen je Dachfläche (`plaene`: Dach-Kennung → Gruppen oder null). Dachflächen werden nie vermischt. */
export function verstringen(g: Gesamt, plaene: Record<string, StringGruppe[] | null | undefined>, b?: Bereich | null, manuell: Record<string, StringManuell | null | undefined> = {}): StringPlan {
  const strings: StringInfo[] = [];
  const daecher: DachStrings[] = [];
  const laengen: Record<number, number> = {};
  let nr = 1;
  for (const d of g.daecher) {
    const hand = manuell[d.id];
    const modules = d.layout?.modules;
    if (hand && modules) {
      const meldungen = pruefeManuell(modules.length, hand, b);
      const gruppen: StringGruppe[] = [];
      for (const s of hand.strings) {
        const gu = s.module.filter((i) => i >= 0 && i < modules.length);
        if (gu.length === 0) continue;
        strings.push({ nr, roofId: d.id, roofName: d.name, gruppe: s.mppt ?? 0, mppt: s.mppt, module: gu });
        nr++;
        laengen[gu.length] = (laengen[gu.length] ?? 0) + 1;
        const x = gruppen.find((q) => q.laenge === gu.length);
        if (x) x.anzahl++;
        else gruppen.push({ laenge: gu.length, anzahl: 1 });
      }
      const zugeordnet = new Set(hand.strings.flatMap((s) => s.module).filter((i) => i >= 0 && i < modules.length)).size;
      daecher.push({ roofId: d.id, name: d.name, module: modules.length, gruppen, zugeordnet, ok: meldungen.length === 0, meldungen, manuell: true });
      continue;
    }
    const gruppen = plaene[d.id];
    if (!gruppen || gruppen.length === 0 || !modules) continue;
    const pruef = pruefePlan(modules.length, gruppen, b);
    daecher.push({ roofId: d.id, name: d.name, module: modules.length, gruppen, zugeordnet: pruef.zugeordnet, ok: pruef.ok, meldungen: pruef.meldungen, manuell: false });
    const folge = reihenfolge(modules);
    let pos = 0;
    gruppen.forEach((gr, gi) => {
      for (let i = 0; i < gr.anzahl && pos < folge.length; i++) {
        const stueck = folge.slice(pos, pos + gr.laenge);
        strings.push({ nr: nr++, roofId: d.id, roofName: d.name, gruppe: gi + 1, mppt: null, module: stueck });
        laengen[stueck.length] = (laengen[stueck.length] ?? 0) + 1;
        pos += stueck.length;
      }
    });
  }
  const mppt = mpptGleichLang(strings);
  return { strings, daecher, laengen, ok: daecher.every((x) => x.ok) && mppt.length === 0, mpptMeldungen: mppt };
}

/** Gruppen je Dachfläche aus dem Projekt. */
export function plaeneAus(p: { roofs: { id: string; stringGruppen?: StringGruppe[] | null }[] }): Record<string, StringGruppe[] | null> {
  return Object.fromEntries(p.roofs.map((r) => [r.id, r.stringGruppen ?? null]));
}

export function manuellAus(p: { roofs: { id: string; stringManuell?: StringManuell | null }[] }): Record<string, StringManuell | null> {
  return Object.fromEntries(p.roofs.map((r) => [r.id, r.stringManuell ?? null]));
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
