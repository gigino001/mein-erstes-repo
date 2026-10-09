import type { Point } from "@pv-dachplaner/geometry-core";
import type { Ausrichtung, Project, RoofPlane } from "../model";
import type { Gesamt } from "../berechnung";
import { punktEinfuegen, punktLoeschen, verschieben } from "./geom";
import type { EinrastErgebnis } from "./einrasten";
import { Verlauf } from "./verlauf";

function lesen(): boolean {
  try {
    return localStorage.getItem("pv-einrasten") !== "aus";
  } catch {
    return true;
  }
}

export type Werkzeug = "auswahl" | "dach";
export interface Auswahl {
  roofId: string;
  /** Index der gewählten Ecke oder null, wenn nur die Fläche gewählt ist */
  punkt: number | null;
}

/** Zustand des Editors: Projekt, Werkzeug, Auswahl, Entwurf und Rückgängig-Verlauf. Änderungen melden sich über `beiAenderung`. */
export class EditorZustand {
  projekt = $state<Project>(undefined as unknown as Project);
  werkzeug = $state<Werkzeug>("dach");
  auswahl = $state<Auswahl | null>(null);
  entwurf = $state<Point[]>([]);
  /** Einrasten an Ecken und Kanten (wird im Browser gemerkt) */
  einrasten = $state(lesen());
  /** Zielpunkt, an den gerade eingerastet wird (für die Markierung) */
  einrastZiel = $state<EinrastErgebnis | null>(null);
  /** Position (Bildschirmpixel) für die Lupe, solange eine Ecke gezogen wird */
  lupe = $state<{ x: number; y: number } | null>(null);
  /** Wartet auf das Antippen der Traufkante (setzt die Fallrichtung) */
  traufeWahl = $state(false);
  /** Aktuelles Rechenergebnis (wird vom Editor nach Änderungen gesetzt) */
  ergebnis = $state<Gesamt | null>(null);
  kannZurueck = $state(false);
  kannVor = $state(false);
  private verlauf = new Verlauf<RoofPlane[]>();

  constructor(
    projekt: Project,
    private beiAenderung: (p: Project) => void,
  ) {
    this.projekt = projekt;
    this.werkzeug = projekt.roofs.length === 0 ? "dach" : "auswahl";
  }

  dach(id: string): RoofPlane | undefined {
    return this.projekt.roofs.find((r) => r.id === id);
  }

  /** Unabhängige Kopie des Umrisses (für Ziehbewegungen). */
  umrissKopie(id: string): Point[] {
    return ($state.snapshot(this.dach(id)?.outline ?? []) as Point[]).map((p) => ({ ...p }));
  }

  get gewaehltesDach(): RoofPlane | undefined {
    return this.auswahl ? this.dach(this.auswahl.roofId) : undefined;
  }

  private merken() {
    this.verlauf.merken($state.snapshot(this.projekt.roofs) as RoofPlane[]);
    this.kannZurueck = true;
    this.kannVor = false;
  }
  private geaendert() {
    this.beiAenderung($state.snapshot(this.projekt) as Project);
  }

  schalteEinrasten() {
    this.einrasten = !this.einrasten;
    this.einrastZiel = null;
    try {
      localStorage.setItem("pv-einrasten", this.einrasten ? "an" : "aus");
    } catch {
      /* ohne Speicher weiter */
    }
  }

  setzeWerkzeug(w: Werkzeug) {
    this.werkzeug = w;
    this.traufeWahl = false;
    if (w === "auswahl") this.entwurf = [];
    else this.auswahl = null;
  }

  waehleDach(id: string | null) {
    this.auswahl = id ? { roofId: id, punkt: null } : null;
  }
  waehlePunkt(roofId: string, punkt: number | null) {
    this.auswahl = { roofId, punkt };
  }

  // ----- Entwurf (neues Dach zeichnen) -----
  entwurfPunkt(p: Point) {
    this.entwurf = [...this.entwurf, { ...p }];
  }
  entwurfLetztenEntfernen() {
    this.entwurf = this.entwurf.slice(0, -1);
  }
  entwurfVerwerfen() {
    this.entwurf = [];
  }
  /** Schließt den Entwurf zu einer Dachfläche (mindestens 3 Ecken). */
  entwurfAbschliessen(): RoofPlane | null {
    if (this.entwurf.length < 3) return null;
    this.merken();
    const nr = this.projekt.roofs.reduce((m, r) => Math.max(m, Number(/^D(\d+)$/.exec(r.name)?.[1] ?? 0)), 0) + 1;
    const dach: RoofPlane = {
      id: crypto.randomUUID(),
      name: `D${nr}`,
      outline: this.entwurf.map((p) => ({ ...p })),
      slopeDeg: null,
      azimuthDeg: null,
      quelle: "manuell",
    };
    this.projekt.roofs.push(dach);
    this.entwurf = [];
    this.werkzeug = "auswahl";
    this.auswahl = { roofId: dach.id, punkt: null };
    this.geaendert();
    return dach;
  }

  // ----- Ändern -----
  /** Beginn einer Ziehbewegung: Stand für „Rückgängig“ merken. */
  ziehenBeginn() {
    this.merken();
  }
  punktSetzen(roofId: string, index: number, p: Point) {
    const d = this.dach(roofId);
    if (d?.outline[index]) d.outline[index] = { ...p };
  }
  dachSetzen(roofId: string, outline: Point[]) {
    const d = this.dach(roofId);
    if (d) d.outline = outline.map((p) => ({ ...p }));
  }
  ziehenEnde() {
    this.geaendert();
  }
  /** Fügt in der Mitte der Kante `kante` (von Punkt kante zu kante+1) einen Punkt ein und wählt ihn. */
  kanteTeilen(roofId: string, kante: number, p: Point) {
    const d = this.dach(roofId);
    if (!d) return;
    this.merken();
    d.outline = punktEinfuegen($state.snapshot(d.outline) as Point[], kante, p);
    this.auswahl = { roofId, punkt: kante + 1 };
    this.geaendert();
  }
  punktEntfernen() {
    const a = this.auswahl;
    const d = this.gewaehltesDach;
    if (!a || a.punkt === null || !d || d.outline.length <= 3) return;
    this.merken();
    d.outline = punktLoeschen($state.snapshot(d.outline) as Point[], a.punkt);
    this.auswahl = { roofId: a.roofId, punkt: null };
    this.geaendert();
  }
  dachEntfernen() {
    const a = this.auswahl;
    if (!a) return;
    this.merken();
    this.projekt.roofs = this.projekt.roofs.filter((r) => r.id !== a.roofId);
    this.auswahl = null;
    this.geaendert();
  }
  dachVerschieben(roofId: string, dx: number, dy: number) {
    const d = this.dach(roofId);
    if (!d) return;
    this.merken();
    d.outline = verschieben($state.snapshot(d.outline) as Point[], dx, dy);
    this.geaendert();
  }

  // ----- Eigenschaften und Einstellungen -----
  setzeNeigung(roofId: string, grad: number | null) {
    const d = this.dach(roofId);
    if (!d) return;
    const neu = grad === null || !Number.isFinite(grad) ? null : Math.min(89, Math.max(0, Math.round(grad * 10) / 10));
    if (neu === d.slopeDeg) return;
    this.merken();
    d.slopeDeg = neu;
    this.geaendert();
  }
  setzeAusrichtung(roofId: string, grad: number | null) {
    const d = this.dach(roofId);
    if (!d) return;
    const neu = grad === null || !Number.isFinite(grad) ? null : ((Math.round(grad * 10) / 10) % 360 + 360) % 360;
    if (neu === d.azimuthDeg) return;
    this.merken();
    d.azimuthDeg = neu;
    this.traufeWahl = false;
    this.geaendert();
  }
  setzeRandabstand(m: 0 | 0.1 | 0.2) {
    this.projekt.settings.randabstandM = m;
    this.geaendert();
  }
  setzeAusrichtungsModus(o: Ausrichtung) {
    this.projekt.settings.orientation = o;
    this.geaendert();
  }

  // ----- Rückgängig / Wiederholen -----
  private uebernehmen(roofs: RoofPlane[] | null) {
    if (!roofs) return;
    this.projekt.roofs = roofs;
    if (this.auswahl && !this.dach(this.auswahl.roofId)) this.auswahl = null;
    else if (this.auswahl && this.auswahl.punkt !== null) {
      const d = this.gewaehltesDach;
      if (!d || this.auswahl.punkt >= d.outline.length) this.auswahl = { roofId: this.auswahl.roofId, punkt: null };
    }
    this.kannZurueck = this.verlauf.kannZurueck;
    this.kannVor = this.verlauf.kannVor;
    this.geaendert();
  }
  rueckgaengig() {
    this.uebernehmen(this.verlauf.rueckgaengig($state.snapshot(this.projekt.roofs) as RoofPlane[]));
  }
  wiederholen() {
    this.uebernehmen(this.verlauf.wiederholen($state.snapshot(this.projekt.roofs) as RoofPlane[]));
  }
}
