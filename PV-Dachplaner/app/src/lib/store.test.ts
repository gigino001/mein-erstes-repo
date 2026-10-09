import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { alleProjekte, autospeicher, duplizieren, exportieren, importieren, loeschen, projekt, speichern, _zuruecksetzen } from "./store";
import { neuesProjekt, pruefeProjekt, type Project } from "./model";

beforeEach(async () => {
  await _zuruecksetzen();
  indexedDB.deleteDatabase("pv-dachplaner");
});

const dach = (id = "d1") => ({
  id,
  name: "D1",
  outline: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 }],
  slopeDeg: 35,
  azimuthDeg: 180,
  quelle: "manuell" as const,
});

describe("Speicher (IndexedDB)", () => {
  it("speichert, liest, erhöht die Version und löscht", async () => {
    const p = neuesProjekt({ name: "Musterstr. 12" }, new Date("2026-10-09T10:00:00Z"));
    const s = await speichern({ ...p, roofs: [dach()] }, new Date("2026-10-09T10:05:00Z"));
    expect(s.version).toBe(2);
    expect(s.updated).toBe("2026-10-09T10:05:00.000Z");
    const gelesen = await projekt(p.id);
    expect(gelesen?.roofs[0]?.outline).toHaveLength(4);
    await loeschen(p.id);
    expect(await projekt(p.id)).toBeUndefined();
  });

  it("sortiert nach letzter Änderung (neueste zuerst)", async () => {
    const a = await speichern(neuesProjekt({ name: "A" }), new Date("2026-10-01T00:00:00Z"));
    const b = await speichern(neuesProjekt({ name: "B" }), new Date("2026-10-03T00:00:00Z"));
    const c = await speichern(neuesProjekt({ name: "C" }), new Date("2026-10-02T00:00:00Z"));
    expect((await alleProjekte()).map((p) => p.id)).toEqual([b.id, c.id, a.id]);
  });

  it("dupliziert mit neuer Kennung und eigenem Verlauf", async () => {
    const o = await speichern({ ...neuesProjekt({ name: "Original" }), roofs: [dach()] });
    const k = await duplizieren(o.id);
    expect(k?.id).not.toBe(o.id);
    expect(k?.name).toBe("Original (Kopie)");
    expect(k?.version).toBe(1);
    expect(k?.roofs).toHaveLength(1);
    expect((await alleProjekte()).length).toBe(2);
  });
});

describe("Sicherung", () => {
  it("Export und Import ergeben dasselbe Projekt", async () => {
    const o = await speichern({ ...neuesProjekt({ name: "X" }), roofs: [dach()] });
    const text = JSON.stringify(await exportieren());
    await loeschen(o.id);
    const erg = await importieren(text);
    expect(erg).toEqual({ neu: 1, aktualisiert: 0, uebersprungen: 0, fehler: [] });
    expect(await projekt(o.id)).toEqual(o);
  });

  it("neuerer Stand überschreibt, älterer nicht", async () => {
    const o = await speichern({ ...neuesProjekt({ name: "Alt" }) }, new Date("2026-10-01T00:00:00Z"));
    const neuer: Project = { ...o, name: "Neu", updated: "2026-10-05T00:00:00.000Z" };
    const aelter: Project = { ...o, name: "Älter", updated: "2026-09-01T00:00:00.000Z" };
    const mk = (p: Project) => JSON.stringify({ format: "pv-dachplaner", schema: 1, exportiertAm: "x", projekte: [p] });
    expect((await importieren(mk(neuer))).aktualisiert).toBe(1);
    expect((await projekt(o.id))?.name).toBe("Neu");
    expect((await importieren(mk(aelter))).uebersprungen).toBe(1);
    expect((await projekt(o.id))?.name).toBe("Neu");
  });

  it("lehnt Fremdes, Kaputtes und zu Neues ab", async () => {
    await expect(importieren("kein json")).rejects.toThrow(/kein JSON/);
    await expect(importieren('{"format":"anderes"}')).rejects.toThrow(/keine PV-Dachplaner-Sicherung/);
    await expect(importieren('{"format":"pv-dachplaner","schema":99,"projekte":[]}')).rejects.toThrow(/neueren App-Version/);
  });

  it("meldet ungültige Projekte und speichert gültige trotzdem", async () => {
    const gut = neuesProjekt({ name: "Gut" });
    const schlecht = { ...neuesProjekt({ name: "Schlecht" }), roofs: [{ id: "r1", name: "D1", outline: [{ x: 0, y: 0 }], slopeDeg: 30, azimuthDeg: 0 }] };
    const text = JSON.stringify({ format: "pv-dachplaner", schema: 1, exportiertAm: "x", projekte: [gut, schlecht] });
    const erg = await importieren(text);
    expect(erg.neu).toBe(1);
    expect(erg.fehler[0]).toMatch(/mindestens 3 Punkte/);
  });
});

describe("Prüfung", () => {
  it("bereinigt unbekannte Felder und setzt Standardwerte", () => {
    const p = pruefeProjekt({ id: "abcdefgh", name: "N", created: "a", updated: "b", fremd: 1, settings: { randabstandM: 0.5 } });
    expect(p.settings).toEqual({ randabstandM: 0, orientation: "hochkant" });
    expect("fremd" in p).toBe(false);
    expect(p.roofs).toEqual([]);
  });
  it("lehnt ungültige Neigung ab", () => {
    expect(() => pruefeProjekt({ id: "abcdefgh", name: "N", created: "a", updated: "b", roofs: [{ id: "r", outline: dach().outline, slopeDeg: 95, azimuthDeg: 0 }] })).toThrow(/Neigung ungültig/);
  });
});

describe("Autospeicher", () => {
  it("fasst schnelle Änderungen zusammen und speichert den letzten Stand", async () => {
    // Nur setTimeout/clearTimeout ersetzen: fake-indexeddb braucht setImmediate
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const p = neuesProjekt({ name: "Auto" });
    const got: Project[] = [];
    const a = autospeicher((x) => got.push(x), 500);
    a.planen({ ...p, name: "1" });
    a.planen({ ...p, name: "2" });
    a.planen({ ...p, name: "3" });
    await vi.advanceTimersByTimeAsync(499);
    expect(got).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(2);
    vi.useRealTimers();
    await a.leeren();
    expect(got).toHaveLength(1);
    expect(got[0]?.name).toBe("3");
    expect((await projekt(p.id))?.name).toBe("3");
  });
  it("leeren speichert sofort", async () => {
    const p = neuesProjekt({ name: "Sofort" });
    const got: Project[] = [];
    const a = autospeicher((x) => got.push(x), 10_000);
    a.planen(p);
    await a.leeren();
    expect(got).toHaveLength(1);
  });
});
