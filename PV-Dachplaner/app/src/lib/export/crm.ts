import { zipSync, strToU8 } from "fflate";
import type { Gesamt } from "../berechnung";
import { zahl } from "../berechnung";
import { himmelsrichtung } from "../format";
import type { Project } from "../model";
import { utmToLngLat } from "../coords";
import type { StringPlan } from "../strings";

export const EXPORT_FORMAT = "pv-dachplaner-projekt";
export const EXPORT_SCHEMA = 1;

export interface ExportKontext {
  projekt: Project;
  ergebnis: Gesamt;
  strings: StringPlan | null;
  erstelltAm: Date;
  version: string;
}

const r = (x: number, s = 2) => Math.round(x * 10 ** s) / 10 ** s;

/** Kennzahlen je Dachfläche in einer flachen, CRM-tauglichen Form. */
function daecherZeilen(k: ExportKontext) {
  return k.projekt.roofs.map((roof) => {
    const e = k.ergebnis.daecher.find((x) => x.id === roof.id);
    const l = e?.layout;
    return {
      name: roof.name,
      neigung_grad: roof.slopeDeg,
      ausrichtung_grad: roof.azimuthDeg,
      himmelsrichtung: roof.azimuthDeg === null ? null : himmelsrichtung(roof.azimuthDeg),
      dachflaeche_m2: l ? r(l.grossAreaM2) : null,
      abzug_rand_m2: l ? r(l.marginLossM2) : null,
      abzug_hindernisse_m2: l ? r(l.obstacleLossM2) : null,
      nutzbar_m2: l ? r(l.usableAreaM2) : null,
      module: l ? l.moduleCount : null,
      module_hochkant: e?.hochkant ?? null,
      module_quer: e?.quer ?? null,
      belegung: l ? l.orientation : null,
      leistung_kwp: l ? r(l.powerKWp) : null,
      status: e?.status ?? "fehlt",
    };
  });
}

/** Vollständiger Export als JSON (Projekt, Ergebnis, Strings). Die Projektdaten lassen sich in der App wieder einlesen. */
export function projektJson(k: ExportKontext): string {
  const p = k.projekt;
  const pos = p.adresse.position;
  const ll = pos ? utmToLngLat(pos) : null;
  return JSON.stringify(
    {
      format: EXPORT_FORMAT,
      schema: EXPORT_SCHEMA,
      erstelltAm: k.erstelltAm.toISOString(),
      appVersion: k.version,
      kunde: { name: p.kunde.name, notiz: p.kunde.notiz },
      adresse: { text: p.adresse.text, utm32: pos ? { ost: r(pos.e, 1), nord: r(pos.n, 1) } : null, wgs84: ll ? { laenge: r(ll.lng, 6), breite: r(ll.lat, 6) } : null },
      bearbeiter: p.bearbeiter,
      luftbildDatum: p.imageDate,
      ergebnis: {
        module: k.ergebnis.module,
        leistung_kwp: r(k.ergebnis.kWp),
        dachflaeche_m2: r(k.ergebnis.schraegflaecheM2),
        nutzbar_m2: r(k.ergebnis.nutzbarM2),
        dachflaechen_unvollstaendig: k.ergebnis.unvollstaendig,
        modul: { breite_m: 1.15, hoehe_m: 1.78, leistung_wp: 460 },
        randabstand_m: p.settings.randabstandM,
        belegung: p.settings.orientation,
        daecher: daecherZeilen(k),
      },
      strings: k.strings
        ? k.strings.strings.map((s) => ({ nr: s.nr, dachflaeche: s.roofName, mppt: s.mppt, module: s.module.length, leistung_kwp: r((s.module.length * 460) / 1000) }))
        : [],
      projekt: p,
    },
    null,
    2,
  );
}

// ---------- CSV (Semikolon, Dezimalkomma, UTF-8 mit BOM: öffnet in deutschem Excel und lässt sich in CRMs importieren) ----------

const feld = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "number" ? String(v).replace(".", ",") : String(v);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (kopf: string[], zeilen: unknown[][]) => "﻿" + [kopf, ...zeilen].map((z) => z.map(feld).join(";")).join("\r\n") + "\r\n";

export function projektCsv(k: ExportKontext): string {
  const p = k.projekt;
  const pos = p.adresse.position;
  const ll = pos ? utmToLngLat(pos) : null;
  const kopf = ["projekt_id", "projekt_name", "kunde_name", "adresse", "breitengrad", "laengengrad", "datum", "bearbeiter", "dachflaechen", "module", "leistung_kwp", "dachflaeche_m2", "nutzbar_m2", "randabstand_cm", "belegung", "strings", "luftbild_datum", "notiz"];
  const zeile = [
    p.id,
    p.name,
    p.kunde.name,
    p.adresse.text,
    ll ? r(ll.lat, 6) : "",
    ll ? r(ll.lng, 6) : "",
    k.erstelltAm.toISOString().slice(0, 10),
    p.bearbeiter,
    p.roofs.length,
    k.ergebnis.module,
    r(k.ergebnis.kWp),
    r(k.ergebnis.schraegflaecheM2),
    r(k.ergebnis.nutzbarM2),
    Math.round(p.settings.randabstandM * 100),
    p.settings.orientation,
    k.strings?.strings.length ?? 0,
    p.imageDate ?? "",
    p.kunde.notiz,
  ];
  return csv(kopf, [zeile]);
}

export function daecherCsv(k: ExportKontext): string {
  const kopf = ["projekt_id", "name", "neigung_grad", "ausrichtung_grad", "himmelsrichtung", "dachflaeche_m2", "abzug_rand_m2", "abzug_hindernisse_m2", "nutzbar_m2", "module", "module_hochkant", "module_quer", "belegung", "leistung_kwp", "status"];
  const zeilen = daecherZeilen(k).map((d) => [k.projekt.id, d.name, d.neigung_grad, d.ausrichtung_grad, d.himmelsrichtung, d.dachflaeche_m2, d.abzug_rand_m2, d.abzug_hindernisse_m2, d.nutzbar_m2, d.module, d.module_hochkant, d.module_quer, d.belegung, d.leistung_kwp, d.status]);
  return csv(kopf, zeilen);
}

/** Kurzfassung für ein Notizfeld im CRM. */
export function kurztext(k: ExportKontext): string {
  const p = k.projekt;
  const teile = p.roofs.map((roof) => {
    const e = k.ergebnis.daecher.find((x) => x.id === roof.id);
    if (!e?.layout) return `${roof.name}: Angaben fehlen`;
    return `${roof.name}: ${e.layout.moduleCount} Module, ${roof.slopeDeg}° ${himmelsrichtung(roof.azimuthDeg ?? 0)}`;
  });
  const kopf = `PV-Planung ${p.adresse.text || p.name}${p.kunde.name ? ` (${p.kunde.name})` : ""}`;
  return `${kopf}: ${k.ergebnis.module} Module, ${zahl(k.ergebnis.kWp, 2)} kWp, ${zahl(k.ergebnis.nutzbarM2)} m² nutzbar. ${teile.join("; ")}.`;
}

const LIESMICH = `PV-Dachplaner – Exportpaket

planung.pdf      Planungsunterlage mit Dachbild, Modulbelegung und Kennzahlen
projekt.json     vollständiger Datensatz (maschinenlesbar, Koordinaten EPSG:25832 und WGS84)
projekt.csv      eine Zeile je Projekt (Semikolon, Dezimalkomma, UTF-8) – zum Import in CRM oder Excel
daecher.csv      eine Zeile je Dachfläche, verknüpft über projekt_id

Hinweis: Planungshilfe auf Basis von Luftbild und Eingaben, keine verbindliche Fachplanung.
`;

/** ZIP mit PDF, JSON und CSV für das CRM. */
export function paketZip(k: ExportKontext, pdf: Uint8Array | null): Uint8Array {
  const dateien: Record<string, Uint8Array> = {
    "projekt.json": strToU8(projektJson(k)),
    "projekt.csv": strToU8(projektCsv(k)),
    "daecher.csv": strToU8(daecherCsv(k)),
    "LIESMICH.txt": strToU8(LIESMICH),
  };
  if (pdf) dateien["planung.pdf"] = pdf;
  return zipSync(dateien, { level: 6 });
}
