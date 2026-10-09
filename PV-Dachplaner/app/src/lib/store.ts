import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { pruefeProjekt, SCHEMA_VERSION, type Project } from "./model";

interface Schema extends DBSchema {
  projekte: { key: string; value: Project; indexes: { updated: string } };
}

const DB_NAME = "pv-dachplaner";
let dbPromise: Promise<IDBPDatabase<Schema>> | undefined;

function db() {
  dbPromise ??= openDB<Schema>(DB_NAME, 1, {
    upgrade(d) {
      const s = d.createObjectStore("projekte", { keyPath: "id" });
      s.createIndex("updated", "updated");
    },
  });
  return dbPromise;
}

/** Für Tests: Verbindung schließen und Zustand vergessen. */
export async function _zuruecksetzen() {
  if (dbPromise) (await dbPromise).close();
  dbPromise = undefined;
}

/** Fordert dauerhaften Speicher an (Safari räumt sonst bei Platzmangel auf). Gibt zurück, ob er zugesagt wurde. */
export async function dauerhaftAnfordern(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* nicht unterstützt */
  }
  return false;
}

export async function alleProjekte(): Promise<Project[]> {
  const alle = await (await db()).getAll("projekte");
  return alle.sort((a, b) => b.updated.localeCompare(a.updated));
}

export async function projekt(id: string): Promise<Project | undefined> {
  return (await db()).get("projekte", id);
}

/** Speichert ein Projekt; erhöht Version und Änderungszeit. Gibt das gespeicherte Projekt zurück. */
export async function speichern(p: Project, jetzt = new Date()): Promise<Project> {
  const neu: Project = { ...p, version: p.version + 1, updated: jetzt.toISOString() };
  await (await db()).put("projekte", neu);
  return neu;
}

export async function loeschen(id: string): Promise<void> {
  await (await db()).delete("projekte", id);
}

export async function duplizieren(id: string, jetzt = new Date()): Promise<Project | undefined> {
  const p = await projekt(id);
  if (!p) return undefined;
  const iso = jetzt.toISOString();
  const kopie: Project = structuredClone({ ...p, id: crypto.randomUUID(), name: `${p.name} (Kopie)`, created: iso, updated: iso, version: 1 });
  await (await db()).put("projekte", kopie);
  return kopie;
}

// ---------- Sicherung (Export / Import) ----------

export interface Sicherung {
  format: "pv-dachplaner";
  schema: number;
  exportiertAm: string;
  projekte: Project[];
}

export async function exportieren(jetzt = new Date()): Promise<Sicherung> {
  return { format: "pv-dachplaner", schema: SCHEMA_VERSION, exportiertAm: jetzt.toISOString(), projekte: await alleProjekte() };
}

export interface ImportErgebnis {
  neu: number;
  aktualisiert: number;
  uebersprungen: number;
  fehler: string[];
}

/** Liest eine Sicherungsdatei. Neuere Stände überschreiben ältere; ungültige Projekte werden gemeldet, nicht gespeichert. */
export async function importieren(text: string): Promise<ImportErgebnis> {
  let daten: unknown;
  try {
    daten = JSON.parse(text);
  } catch {
    throw new Error("Die Datei ist keine gültige Sicherung (kein JSON).");
  }
  if (typeof daten !== "object" || daten === null || (daten as Sicherung).format !== "pv-dachplaner") {
    throw new Error("Die Datei ist keine PV-Dachplaner-Sicherung.");
  }
  const s = daten as Sicherung;
  if (typeof s.schema !== "number" || s.schema > SCHEMA_VERSION) {
    throw new Error("Die Sicherung stammt aus einer neueren App-Version. Bitte die App aktualisieren.");
  }
  if (!Array.isArray(s.projekte)) throw new Error("Die Sicherung enthält keine Projekte.");
  const erg: ImportErgebnis = { neu: 0, aktualisiert: 0, uebersprungen: 0, fehler: [] };
  for (const roh of s.projekte) {
    let p: Project;
    try {
      p = pruefeProjekt(roh);
    } catch (e) {
      erg.fehler.push((e as Error).message);
      continue;
    }
    const vorhanden = await projekt(p.id);
    if (!vorhanden) {
      await (await db()).put("projekte", p);
      erg.neu++;
    } else if (p.updated > vorhanden.updated) {
      await (await db()).put("projekte", p);
      erg.aktualisiert++;
    } else {
      erg.uebersprungen++;
    }
  }
  return erg;
}

/** Entprellter Speicher: ruft `speichern` frühestens `ms` nach der letzten Änderung auf. */
export function autospeicher(onGespeichert: (p: Project) => void, ms = 500) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let letzter: Project | undefined;
  let laufend: Promise<void> = Promise.resolve();
  const ausfuehren = () => {
    const p = letzter;
    letzter = undefined;
    if (!p) return;
    laufend = laufend.then(async () => onGespeichert(await speichern(p)));
  };
  return {
    planen(p: Project) {
      letzter = p;
      clearTimeout(timer);
      timer = setTimeout(ausfuehren, ms);
    },
    /** Sofort speichern (z. B. beim Verlassen der Seite). */
    async leeren() {
      clearTimeout(timer);
      ausfuehren();
      await laufend;
    },
  };
}
