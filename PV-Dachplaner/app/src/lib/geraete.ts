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
    quelle: "Jolywood Datenblatt JW-HD96N Serie (STC, Frontseite)",
  },
  {
    id: "aiko-a485-mce54db",
    name: "AIKO Neostar 3S+ AIKO-A485-MCE54Db 485 W",
    pmaxW: 485, vmppV: 34.3, imppA: 14.15, vocV: 40.9, iscA: 14.88,
    tkVocProzent: -0.22, tkPmaxProzent: -0.26, tkIscProzent: 0.05,
    maxSystemV: 1500, maxSicherungA: 25, laengeMm: 1762, breiteMm: 1134,
    quelle: "AIKO Datenblatt Neostar 3S+54 AIKO-A-MCE54Db (STC); Artikeltext nennt 30 A, Datenblatt 25 A",
  },
];

const DS_T = "Sungrow Datenblatt SH5/6/8/10/12T V1.1 und SH15/20/25T";
const DS_TP = "Sigenergy Datenblatt Hybrid 5.0–25.0 kW Three Phase (TP)";
const DS_TP2 = "Sigenergy Datenblatt Hybrid 5.0–12.0 kW Three Phase (TP2, vorläufig)";

const sungrow = (id: string, name: string, acKw: number, mppt: { strings: number; maxA: number; iscMaxA: number }[]): WechselrichterTyp => ({
  id, name, hersteller: "Sungrow", acKw, maxDcV: 1000, mpptMinV: 150, mpptMaxV: 950, startV: 180, mppt, quelle: DS_T,
});
const sigen = (id: string, name: string, acKw: number, mppt: { strings: number; maxA: number; iscMaxA: number }[], quelle: string, hinweis?: string): WechselrichterTyp => ({
  id, name, hersteller: "Sigenergy", acKw, maxDcV: 1100, mpptMinV: 160, mpptMaxV: 1000, startV: 180, mppt, quelle, hinweis,
});
const gleich = (n: number, strings: number, maxA: number, iscMaxA: number) => Array.from({ length: n }, () => ({ strings, maxA, iscMaxA }));

export const WECHSELRICHTER: WechselrichterTyp[] = [
  // Sungrow SH-T: 2 MPPT; SH5T/6T/8T je 1 String (16 A / 20 A), SH10T/12T: MPPT 1 mit 2 Strings (32 A / 40 A), MPPT 2 mit 1 String (16 A / 20 A)
  ...[[5, "SH5.0T"], [6, "SH6.0T"], [8, "SH8.0T"]].map(([kw, n]) => sungrow(`sungrow-${String(n).toLowerCase()}`, `Sungrow ${n}`, kw as number, gleich(2, 1, 16, 20))),
  ...[[10, "SH10T"], [12, "SH12T"]].map(([kw, n]) => sungrow(`sungrow-${String(n).toLowerCase()}`, `Sungrow ${n}`, kw as number, [{ strings: 2, maxA: 32, iscMaxA: 40 }, { strings: 1, maxA: 16, iscMaxA: 20 }])),
  // Sungrow SH15T/20T/25T: 3 MPPT mit 2/2/1 Strings
  ...[[15, "SH15T"], [20, "SH20T"], [25, "SH25T"]].map(([kw, n]) => sungrow(`sungrow-${String(n).toLowerCase()}`, `Sungrow ${n}`, kw as number, [{ strings: 2, maxA: 32, iscMaxA: 40 }, { strings: 2, maxA: 32, iscMaxA: 40 }, { strings: 1, maxA: 16, iscMaxA: 20 }])),
  // Sigen Hybrid TP2: 3.0–8.0 kW je MPPT 1 String 16 A / 22 A; 10.0/12.0 kW: MPPT 1 mit 1 String, MPPT 2 mit 2 Strings (16/32 A, 22/44 A)
  ...[3, 4].map((kw) => sigen(`sigen-hybrid-tp2-${kw}`, `Sigen Hybrid ${kw}.0 kW TP2`, kw, gleich(2, 1, 16, 22), DS_TP2, "3.0/4.0 kW: Werte der 5.0-kW-Baureihe übernommen, kein eigenes Datenblatt gefunden.")),
  ...[5, 6, 8].map((kw) => sigen(`sigen-hybrid-tp2-${kw}`, `Sigen Hybrid ${kw}.0 kW TP2`, kw, gleich(2, 1, 16, 22), DS_TP2)),
  ...[10, 12].map((kw) => sigen(`sigen-hybrid-tp2-${kw}`, `Sigen Hybrid ${kw}.0 kW TP2`, kw, [{ strings: 1, maxA: 16, iscMaxA: 22 }, { strings: 2, maxA: 32, iscMaxA: 44 }], DS_TP2)),
  // Sigen Energy Controller / Hybrid TP: je MPPT 1 String, 16 A / 20 A; 5–8 kW 2 MPPT, 10–15 kW 3 MPPT, 17–25 kW 4 MPPT (30 kW: 4 laut Artikelliste)
  ...[[5, 2], [6, 2], [8, 2], [10, 3], [12, 3], [15, 3], [17, 4], [20, 4], [25, 4], [30, 4]].map(([kw, m]) => sigen(`sigen-ec-${kw}`, `Sigen Energy Controller ${kw}.0 kW`, kw!, gleich(m!, 1, 16, 20), DS_TP, kw === 30 ? "30 kW: nicht im 5.0–25.0-kW-Datenblatt; Werte der Baureihe übernommen." : undefined)),
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
  const grenzeV = Math.min(w.maxDcV, Number.isFinite(m.maxSystemV) ? m.maxSystemV : Infinity);
  if (!Number.isFinite(m.maxSystemV)) warnungen.push("Die maximale Systemspannung des Moduls fehlt; es gilt nur die Grenze des Wechselrichters.");
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
  if (Number.isFinite(m.iscA) && m.iscA > Math.min(...w.mppt.map((x) => x.iscMaxA).filter(Number.isFinite))) fehler.push(`Kurzschlussstrom des Moduls (${r(m.iscA)} A) übersteigt den zulässigen Wert je MPPT (${Math.min(...w.mppt.map((x) => x.iscMaxA).filter(Number.isFinite))} A).`);
  const minA = Math.min(...w.mppt.map((x) => x.maxA).filter(Number.isFinite));
  if (Number.isFinite(m.imppA) && m.imppA > minA) warnungen.push(`MPP-Strom des Moduls (${r(m.imppA)} A) liegt über dem maximalen Eingangsstrom einzelner MPPT-Eingänge (${r(minA)} A): der Wechselrichter begrenzt dort die Leistung.`);
  if (min > max) fehler.push(`Mit ${m.name} an ${w.name} ist keine zulässige Stringlänge möglich (mindestens ${min}, höchstens ${max}).`);
  if (w.hinweis) warnungen.push(w.hinweis);
  return { ok: fehler.length === 0, bereich: min <= max ? { min, max } : null, zeilen, warnungen, fehler };
}

export const modulPerId = (id: string | null | undefined) => MODULE.find((m) => m.id === id) ?? null;
export const wechselrichterPerId = (id: string | null | undefined) => WECHSELRICHTER.find((w) => w.id === id) ?? null;

/**
 * Prüft die Strings gegen den Wechselrichter: MPPT-Nummern, Strings je Eingang, Kurzschlussstrom je Eingang (parallele Strings),
 * Zahl der benötigten Eingänge bei automatischer Gruppenbildung.
 */
export function wechselrichterPruefung(strings: { nr: number; mppt: number | null; gruppe: number; roofId: string }[], m: ModulTyp, w: WechselrichterTyp): { fehler: string[]; hinweise: string[] } {
  const fehler: string[] = [];
  const hinweise: string[] = [];
  const hand = strings.filter((s) => s.mppt !== null);
  const auto = strings.filter((s) => s.mppt === null);
  const je = new Map<number, number>();
  for (const s of hand) je.set(s.mppt!, (je.get(s.mppt!) ?? 0) + 1);
  for (const [nr, n] of je) {
    const e = w.mppt[nr - 1];
    if (!e) {
      fehler.push(`MPPT ${nr} gibt es bei ${w.name} nicht (${w.mppt.length} Eingänge).`);
      continue;
    }
    if (n > e.strings) fehler.push(`MPPT ${nr}: ${n} Strings angeschlossen, erlaubt sind ${e.strings}.`);
    if (Number.isFinite(m.iscA) && Number.isFinite(e.iscMaxA) && n * m.iscA > e.iscMaxA) fehler.push(`MPPT ${nr}: Kurzschlussstrom ${r(n * m.iscA)} A (${n} × ${r(m.iscA)} A) übersteigt ${e.iscMaxA} A.`);
    if (Number.isFinite(m.imppA) && Number.isFinite(e.maxA) && n * m.imppA > e.maxA) hinweise.push(`MPPT ${nr}: MPP-Strom ${r(n * m.imppA)} A über dem Eingangsstrom ${e.maxA} A – Leistungsbegrenzung.`);
  }
  if (auto.length > 0) {
    const gruppen = new Set(auto.map((s) => `${s.roofId}:${s.gruppe}`)).size;
    const frei = w.mppt.length - je.size;
    if (gruppen > frei) hinweise.push(`Die automatischen Gruppen brauchen ${gruppen} MPPT-Eingänge, frei sind ${Math.max(frei, 0)} von ${w.mppt.length}.`);
  }
  return { fehler, hinweise };
}

// ---------- Eigene Geräte (Eingabemaske, Import) ----------

const zahlOderNaN = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Liest ein Modul aus gespeicherten/importierten Daten; fehlende Zahlen werden NaN (dann gibt es keine Stringgrenzen). */
export function leseModul(v: unknown): ModulTyp | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  const id = text(o.id), name = text(o.name);
  const pmax = zahlOderNaN(o.pmaxW);
  if (!id || !name || !(pmax > 0)) return null;
  return {
    id, name, pmaxW: pmax,
    vmppV: zahlOderNaN(o.vmppV), imppA: zahlOderNaN(o.imppA), vocV: zahlOderNaN(o.vocV), iscA: zahlOderNaN(o.iscA),
    tkVocProzent: zahlOderNaN(o.tkVocProzent), tkPmaxProzent: zahlOderNaN(o.tkPmaxProzent), tkIscProzent: zahlOderNaN(o.tkIscProzent),
    maxSystemV: zahlOderNaN(o.maxSystemV), maxSicherungA: zahlOderNaN(o.maxSicherungA),
    laengeMm: zahlOderNaN(o.laengeMm), breiteMm: zahlOderNaN(o.breiteMm),
    quelle: text(o.quelle) || "eigene Eingabe",
  };
}

export function leseWechselrichter(v: unknown): WechselrichterTyp | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  const id = text(o.id), name = text(o.name);
  if (!id || !name || !Array.isArray(o.mppt) || o.mppt.length < 1 || o.mppt.length > 12) return null;
  const mppt = o.mppt.map((x) => {
    const e = (typeof x === "object" && x !== null ? x : {}) as Record<string, unknown>;
    const s = zahlOderNaN(e.strings);
    return { strings: Number.isInteger(s) && s >= 1 ? s : 1, maxA: zahlOderNaN(e.maxA), iscMaxA: zahlOderNaN(e.iscMaxA) };
  });
  const maxDc = zahlOderNaN(o.maxDcV), mn = zahlOderNaN(o.mpptMinV), mx = zahlOderNaN(o.mpptMaxV), st = zahlOderNaN(o.startV);
  if (![maxDc, mn, mx, st].every((x) => x > 0)) return null;
  return {
    id, name, hersteller: text(o.hersteller) || "eigene Eingabe", acKw: zahlOderNaN(o.acKw),
    maxDcV: maxDc, mpptMinV: mn, mpptMaxV: mx, startV: st, mppt,
    quelle: text(o.quelle) || "eigene Eingabe", hinweis: text(o.hinweis) || undefined,
  };
}
