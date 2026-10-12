import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { daecherCsv, kurztext, paketZip, projektCsv, projektJson, EXPORT_FORMAT } from "./crm";
import { rechne } from "../berechnung";
import { verstringen } from "../strings";
import { neuesProjekt, type Project } from "../model";

function beispiel(): Project {
  const p = neuesProjekt({ name: "Familie \"Müller\"; Test", adresse: { text: "Herforder Straße 12, Bielefeld", position: { e: 466845, n: 5764729 } }, imageDate: "2024-08-13" }, new Date("2026-10-12T10:00:00Z"));
  p.kunde = { name: "Max Müller", notiz: "Zeile 1\nZeile 2; mit Semikolon" };
  p.bearbeiter = "A. Berater";
  p.roofs = [
    { id: "d1", name: "D1", outline: [{ x: 466000, y: 5764000 }, { x: 466010, y: 5764000 }, { x: 466010, y: 5764005 }, { x: 466000, y: 5764005 }], slopeDeg: 35, azimuthDeg: 180, quelle: "manuell" },
    { id: "d2", name: "D2", outline: [{ x: 466020, y: 5764000 }, { x: 466030, y: 5764000 }, { x: 466030, y: 5764005 }], slopeDeg: null, azimuthDeg: 90, quelle: "manuell" },
  ];
  return p;
}
const kontext = () => {
  const projekt = beispiel();
  const ergebnis = rechne(projekt);
  return { projekt, ergebnis, strings: verstringen(ergebnis, { d1: [{ laenge: 12, anzahl: 2 }] }), erstelltAm: new Date("2026-10-12T10:00:00Z"), version: "0.1.0" };
};

describe("CRM-Export", () => {
  it("JSON enthält dieselben Zahlen wie das Ergebnis und das vollständige Projekt", () => {
    const k = kontext();
    const j = JSON.parse(projektJson(k));
    expect(j.format).toBe(EXPORT_FORMAT);
    expect(j.ergebnis.module).toBe(24);
    expect(j.ergebnis.leistung_kwp).toBe(11.04);
    expect(j.ergebnis.daecher[0]).toMatchObject({ name: "D1", neigung_grad: 35, himmelsrichtung: "S", module: 24, status: "ok" });
    expect(j.ergebnis.daecher[1]).toMatchObject({ name: "D2", module: null, status: "neigung" });
    expect(j.strings).toHaveLength(2);
    expect(j.strings[0].module).toBe(12);
    expect(j.projekt.id).toBe(k.projekt.id);
    expect(j.adresse.wgs84.breite).toBeGreaterThan(51);
  });
  it("CSV: Semikolon, Dezimalkomma, BOM, Anführungszeichen und Zeilenumbrüche korrekt maskiert", () => {
    const k = kontext();
    const c = projektCsv(k);
    expect(c.startsWith("﻿")).toBe(true);
    const zeilen = c.replace("﻿", "").split("\r\n");
    expect(zeilen[0]!.split(";")).toHaveLength(18);
    expect(c).toContain('"Familie ""Müller""; Test"');
    expect(c).toContain('"Zeile 1\nZeile 2; mit Semikolon"');
    expect(c).toContain(";11,04;"); // Leistung mit Komma
    expect(c).toContain(";24;"); // Module
  });
  it("Dachflächen-CSV: eine Zeile je Dachfläche, fehlende Werte leer", () => {
    const c = daecherCsv(kontext()).replace("﻿", "").trim().split("\r\n");
    expect(c).toHaveLength(3);
    expect(c[1]).toContain(";D1;35;180;S;");
    expect(c[2]).toContain(";D2;;90;O;");
    expect(c[2]!.endsWith(";neigung")).toBe(true);
  });
  it("Kurztext nennt Module, Leistung und fehlende Angaben", () => {
    const t = kurztext(kontext());
    expect(t).toContain("PV-Planung Herforder Straße 12, Bielefeld (Max Müller): 24 Module, 11,04 kWp");
    expect(t).toContain("D1: 24 Module, 35° S");
    expect(t).toContain("D2: Angaben fehlen");
  });
  it("ZIP enthält alle Dateien; ohne PDF fehlt nur das PDF", () => {
    const pdf = new Uint8Array([37, 80, 68, 70]);
    const mit = unzipSync(paketZip(kontext(), pdf));
    expect(Object.keys(mit).sort()).toEqual(["LIESMICH.txt", "daecher.csv", "planung.pdf", "projekt.csv", "projekt.json"]);
    expect(Array.from(mit["planung.pdf"]!)).toEqual([37, 80, 68, 70]);
    expect(JSON.parse(strFromU8(mit["projekt.json"]!)).ergebnis.module).toBe(24);
    expect(Object.keys(unzipSync(paketZip(kontext(), null)))).not.toContain("planung.pdf");
  });
});
