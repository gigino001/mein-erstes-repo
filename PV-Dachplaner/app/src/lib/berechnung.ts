import { computeLayout, DEFAULT_MODULE, type LayoutResult, type ModuleType, type ObstacleInput } from "@pv-dachplaner/geometry-core";
import type { Project } from "./model";

export type DachStatus = "ok" | "neigung" | "richtung" | "beides" | "fehler";

export interface DachErgebnis {
  id: string;
  name: string;
  status: DachStatus;
  layout?: LayoutResult;
  hochkant?: number;
  quer?: number;
  hinweise: string[];
}

export interface Gesamt {
  daecher: DachErgebnis[];
  module: number;
  kWp: number;
  schraegflaecheM2: number;
  nutzbarM2: number;
  /** Anzahl Dachflächen, für die Angaben fehlen */
  unvollstaendig: number;
}

/** Berechnet alle Dachflächen eines Projekts. Fehlende Neigung oder Ausrichtung ergibt keinen Wert, sondern einen Hinweis. */
export function rechne(p: Project, modul: ModuleType = DEFAULT_MODULE): Gesamt {
  const hindernisse: ObstacleInput[] = p.obstacles.map((o) => ({ outline: o.outline, bufferM: o.bufferM, subtract: o.abziehen }));
  const daecher: DachErgebnis[] = p.roofs.map((r) => {
    const fehltN = r.slopeDeg === null;
    const fehltR = r.azimuthDeg === null;
    if (fehltN || fehltR) {
      const hinweise = [fehltN ? "Neigung fehlt" : "", fehltR ? "Fallrichtung fehlt" : ""].filter(Boolean);
      return { id: r.id, name: r.name, status: fehltN && fehltR ? "beides" : fehltN ? "neigung" : "richtung", hinweise };
    }
    try {
      const layout = computeLayout({ outline: r.outline, slopeDeg: r.slopeDeg!, azimuthDeg: r.azimuthDeg! }, hindernisse, {
        module: modul,
        edgeMarginM: p.settings.randabstandM,
        orientation: p.settings.orientation,
      });
      const alt = (o: string) => layout.alternatives.find((a) => a.orientation === o)?.count;
      return { id: r.id, name: r.name, status: "ok", layout, hochkant: alt("hochkant"), quer: alt("quer"), hinweise: layout.warnings };
    } catch (e) {
      return { id: r.id, name: r.name, status: "fehler", hinweise: [(e as Error).message] };
    }
  });
  const ok = daecher.filter((d) => d.layout);
  return {
    daecher,
    module: ok.reduce((s, d) => s + d.layout!.moduleCount, 0),
    kWp: ok.reduce((s, d) => s + d.layout!.powerKWp, 0),
    schraegflaecheM2: ok.reduce((s, d) => s + d.layout!.grossAreaM2, 0),
    nutzbarM2: ok.reduce((s, d) => s + d.layout!.usableAreaM2, 0),
    unvollstaendig: daecher.filter((d) => d.status !== "ok").length,
  };
}

/** Zahl mit deutschem Komma. */
export const zahl = (x: number, stellen = 1) => x.toFixed(stellen).replace(".", ",");
