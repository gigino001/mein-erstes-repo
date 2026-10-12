import type { Bereich } from "./strings";

/** Photovoltaikmodul (Datenblattwerte bei STC). */
export interface ModulTyp {
  id: string;
  name: string;
  pmaxW: number;
  vmppV: number;
  imppA: number;
  vocV: number;
  iscA: number;
  /** Temperaturkoeffizienten in %/K (Voc, Pmax negativ) */
  tkVocProzent: number;
  tkPmaxProzent: number;
  tkIscProzent: number;
  maxSystemV: number;
  maxSicherungA: number;
  laengeMm: number;
  breiteMm: number;
  quelle: string;
}

/** Wechselrichter mit gleichartigen MPPT-Eingängen (je Eingang eigene Grenzen). */
export interface WechselrichterTyp {
  id: string;
  name: string;
  hersteller: string;
  acKw: number;
  maxDcV: number;
  mpptMinV: number;
  mpptMaxV: number;
  startV: number;
  /** je MPPT: Strings, max. Eingangsstrom und max. Kurzschlussstrom */
  mppt: { strings: number; maxA: number; iscMaxA: number }[];
  quelle: string;
  /** Hinweis, wenn Werte nicht aus dem exakten Datenblatt stammen */
  hinweis?: string;
}

export const MODULE: ModulTyp[] = [
  {
    id: "jolywood-jw-hd96n-r2-460",
    name: "Jolywood JW-HD96N-R2 460 W",
    pmaxW: 460, vmppV: 30.34, imppA: 15.16, vocV: 35.31, iscA: 16.0,
    tkVocProzent: -0.25, tkPmaxProzent: -0.28, tkIscProzent: 0.045,
    maxSystemV: 1500, maxSicherungA: 35, laengeMm: 1762, breiteMm: 1134,
    quelle: "Jolywood Datenblatt JW-HD96N-R2 435–460 W (STC, Frontseite)",
  },
  {
    id: "aiko-a485-mce54db",
    name: "AIKO Neostar 3S+ A485-MCE54Db 485 W",
    pmaxW: 485, vmppV: NaN, imppA: NaN, vocV: NaN, iscA: NaN,
    tkVocProzent: NaN, tkPmaxProzent: NaN, tkIscProzent: NaN,
    maxSystemV: 1500, maxSicherungA: 30, laengeMm: 1762, breiteMm: 1134,
    quelle: "nur Artikeltext; Spannungen/Ströme fehlen (Datenblatt nachtragen)",
  },
];

const sungrowRT = (id: string, name: string, acKw: number, mpptMin: number, start: number, maxA: number[], iscA: number[], strings: number[], quelle: string, hinweis?: string): WechselrichterTyp => ({
  id, name, hersteller: "Sungrow", acKw, maxDcV: 1000, mpptMinV: mpptMin, mpptMaxV: 950, startV: start,
  mppt: maxA.map((a, i) => ({ strings: strings[i]!, maxA: a, iscMaxA: iscA[i]! })), quelle, hinweis,
});

const DS_RT = "Sungrow SH5.0/10RT Datenblatt V1.5";
const DS_RT20 = "Sungrow SH5.0/6.0/8.0/10RT-20 Datenblatt";
const DS_T = "Sungrow SH15/20/25T Datenblatt";
const DS_SIGEN = "Sigenergy Hybrid-Datenblatt (TP/TP2)";

const sigen = (id: string, name: string, acKw: number, mppt: number, maxA: number, iscA: number, quelle: string, hinweis?: string): WechselrichterTyp => ({
  id, name, hersteller: "Sigenergy", acKw, maxDcV: 1100, mpptMinV: 160, mpptMaxV: 1000, startV: 180,
  mppt: Array.from({ length: mppt }, () => ({ strings: 1, maxA, iscMaxA: iscA })), quelle, hinweis,
});

export const WECHSELRICHTER: WechselrichterTyp[] = [
  sungrowRT("sungrow-sh5.0rt", "Sungrow SH5.0RT", 5, 150, 180, [12.5, 12.5], [18, 18], [1, 1], DS_RT),
  sungrowRT("sungrow-sh6.0rt", "Sungrow SH6.0RT", 6, 200, 250, [12.5, 12.5], [18, 18], [1, 1], DS_RT20, "Spannungen aus dem Datenblatt der -20-Variante; Ströme wie SH5.0RT/SH10RT, bitte gegen Original-Datenblatt prüfen."),
  sungrowRT("sungrow-sh8.0rt", "Sungrow SH8.0RT", 8, 200, 250, [12.5, 12.5], [18, 18], [1, 1], DS_RT20, "Spannungen aus dem Datenblatt der -20-Variante; Ströme wie SH5.0RT/SH10RT, bitte gegen Original-Datenblatt prüfen."),
  sungrowRT("sungrow-sh10rt", "Sungrow SH10RT", 10, 200, 250, [12.5, 25], [18, 36], [1, 2], DS_RT),
  sungrowRT("sungrow-sh15t", "Sungrow SH15T", 15, 150, 180, [32, 32, 16], [40, 40, 20], [2, 2, 1], DS_T),
  sungrowRT("sungrow-sh20t", "Sungrow SH20T", 20, 150, 180, [32, 32, 16], [40, 40, 20], [2, 2, 1], DS_T),
  sungrowRT("sungrow-sh25t", "Sungrow SH25T", 25, 150, 180, [32, 32, 16], [40, 40, 20], [2, 2, 1], DS_T),
  ...[3, 4, 5, 6, 8, 10, 12].map((kw) => sigen(`sigen-hybrid-tp2-${kw}`, `Sigen Hybrid ${kw}.0 kW TP2`, kw, 2, 16, 22, DS_SIGEN, "Je MPPT 16 A (bei Modellen mit zwei Strings je MPPT 16/32 A) – hier vorsichtig mit 16 A und einem String je MPPT geführt.")),
  ...[[5, 2], [6, 2], [8, 2], [10, 3], [12, 3], [15, 3], [17, 4], [20, 4], [25, 4], [30, 4]].map(([kw, m]) => sigen(`sigen-ec-${kw}`, `Sigen Energy Controller ${kw}.0 kW`, kw!, m!, 16, 20, DS_SIGEN, "MPPT-Anzahl aus den Speicherpaketen der Artikelliste; Ströme aus dem TP-Datenblatt.")),
];

export interface Temperaturen {
  kaltC: number;
  heissC: number;
}
export const STANDARD_TEMPERATUREN: Temperaturen = { kaltC: -10, heissC: 70 };

export interface Grenzen {
  ok: boolean;
  bereich: Bereich | null;
  /** nachvollziehbare Rechenschritte und Hinweise */
  zeilen: string[];
  warnungen: string[];
  fehler: string[];
}

const r = (x: number, n = 2) => (Math.round(x * 10 ** n) / 10 ** n).toString().replace(".", ",");

/**
 * Stringlänge (Module in Reihe) für ein Modul an einem Wechselrichter.
 * Maximal: Leerlaufspannung bei Kälte darf die kleinere der Grenzen (Wechselrichter, Modul-Systemspannung) nicht überschreiten
 * und die MPP-Spannung bei Kälte nicht über dem oberen MPPT-Wert liegen.
 * Minimal: MPP-Spannung bei Hitze muss über der unteren MPPT-Grenze liegen, die Leerlaufspannung bei Hitze über der Startspannung.
 * Die Spannungsänderung der MPP-Spannung wird mit dem Pmax-Koeffizienten angenähert (Datenblätter nennen keinen eigenen Wert).
 */
export function stringGrenzen(m: ModulTyp, w: WechselrichterTyp, t: Temperaturen = STANDARD_TEMPERATUREN): Grenzen {
  const fehler: string[] = [];
  const warnungen: string[] = [];
  const zeilen: string[] = [];
  const fehlend = [m.vocV, m.vmppV, m.tkVocProzent, m.tkPmaxProzent].some((x) => !Number.isFinite(x));
  if (fehlend) return { ok: false, bereich: null, zeilen, warnungen, fehler: [`Für ${m.name} fehlen Spannungs- oder Temperaturwerte – bitte das Datenblatt eintragen.`] };
  const dK = (c: number) => c - 25;
  const vocKalt = m.vocV * (1 + (m.tkVocProzent / 100) * dK(t.kaltC));
  const vocHeiss = m.vocV * (1 + (m.tkVocProzent / 100) * dK(t.heissC));
  const vmppKalt = m.vmppV * (1 + (m.tkPmaxProzent / 100) * dK(t.kaltC));
  const vmppHeiss = m.vmppV * (1 + (m.tkPmaxProzent / 100) * dK(t.heissC));
  const grenzeV = Math.min(w.maxDcV, m.maxSystemV);
  const maxLeer = Math.floor(grenzeV / vocKalt);
  const maxMpp = Math.floor(w.mpptMaxV / vmppKalt);
  const max = Math.min(maxLeer, maxMpp);
  const minMpp = Math.ceil(w.mpptMinV / vmppHeiss);
  const minStart = Math.ceil(w.startV / vocHeiss);
  const min = Math.max(minMpp, minStart, 1);
  zeilen.push(`Voc bei ${t.kaltC} °C: ${r(vocKalt)} V; MPP-Spannung bei ${t.kaltC} °C: ${r(vmppKalt)} V`);
  zeilen.push(`Voc bei ${t.heissC} °C: ${r(vocHeiss)} V; MPP-Spannung bei ${t.heissC} °C: ${r(vmppHeiss)} V`);
  zeilen.push(`Höchstens ${maxLeer} Module (${r(grenzeV, 0)} V ÷ ${r(vocKalt)} V) und ${maxMpp} Module (MPPT-Obergrenze ${w.mpptMaxV} V ÷ ${r(vmppKalt)} V) → ${max}`);
  zeilen.push(`Mindestens ${minMpp} Module (MPPT-Untergrenze ${w.mpptMinV} V ÷ ${r(vmppHeiss)} V) und ${minStart} Module (Startspannung ${w.startV} V ÷ ${r(vocHeiss)} V) → ${min}`);
  if (m.iscA > Math.min(...w.mppt.map((x) => x.iscMaxA))) fehler.push(`Kurzschlussstrom des Moduls (${r(m.iscA)} A) übersteigt den zulässigen Wert je MPPT (${Math.min(...w.mppt.map((x) => x.iscMaxA))} A).`);
  const minA = Math.min(...w.mppt.map((x) => x.maxA));
  if (m.imppA > minA) warnungen.push(`MPP-Strom des Moduls (${r(m.imppA)} A) liegt über dem maximalen Eingangsstrom einzelner MPPT-Eingänge (${r(minA)} A): der Wechselrichter begrenzt dort die Leistung.`);
  if (min > max) fehler.push(`Mit ${m.name} an ${w.name} ist keine zulässige Stringlänge möglich (mindestens ${min}, höchstens ${max}).`);
  if (w.hinweis) warnungen.push(w.hinweis);
  return { ok: fehler.length === 0, bereich: min <= max ? { min, max } : null, zeilen, warnungen, fehler };
}

export const modulPerId = (id: string | null | undefined) => MODULE.find((m) => m.id === id) ?? null;
export const wechselrichterPerId = (id: string | null | undefined) => WECHSELRICHTER.find((w) => w.id === id) ?? null;
