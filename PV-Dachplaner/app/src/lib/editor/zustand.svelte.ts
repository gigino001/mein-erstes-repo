import type { Point } from "@pv-dachplaner/geometry-core";
import type { Ausrichtung, Obstacle, ObstacleArt, Project, RoofPlane } from "../model";
import type { Gesamt } from "../berechnung";
import type { StringPlan } from "../strings";
import { drehen, punktEinfuegen, punktLoeschen, rechteckAusDiagonale, schwerpunkt, verschieben, abstand } from "./geom";
import type { EinrastErgebnis } from "./einrasten";
import { Verlauf } from "./verlauf";

function lesen(): boolean {
  try {
    return localStorage.getItem("pv-einrasten") !== "aus";
  } catch {
    return true;
  }
}

export type Werkzeug = "auswahl" | "dach" | "hindernis";
export type HindernisModus = "rechteck" | "vieleck";
export type ObjektArt = "dach" | "hindernis";
export interface Auswahl {
  art: ObjektArt;
  id: string;
  /** Index der gewählten Ecke oder null, wenn nur die Fläche gewählt ist */
  punkt: number | null;
}
interface Stand {
  roofs: RoofPlane[];
  obstacles: Obstacle[];
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
  /** Modulraster auf der Karte zeigen (ausblenden, um Hindernisse besser zu erkennen und zu markieren) */
  moduleSichtbar = $state(true);
  /** Aktuelle Verstringung (wird vom Editor nach Änderungen gesetzt) */
  verstringung = $state<StringPlan | null>(null);
  kannZurueck = $state(false);
  kannVor = $state(false);
  private verlauf = new Verlauf<Stand>();
  /** Hindernisse: Rechteck (zwei Antippen) oder Vieleck */
  hindernisModus = $state<HindernisModus>("rechteck");
  /** Erste Ecke eines Hindernis-Rechtecks samt Ausrichtung (Bogenmaß) */
  rechteckStart = $state<{ p: Point; winkel: number } | null>(null);

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
  hindernis(id: string): Obstacle | undefined {
    return this.projekt.obstacles.find((o) => o.id === id);
  }
  objekt(art: ObjektArt, id: string): RoofPlane | Obstacle | undefined {
    return art === "dach" ? this.dach(id) : this.hindernis(id);
  }

  /** Unabhängige Kopie des Umrisses (für Ziehbewegungen). */
  umrissKopie(art: ObjektArt, id: string): Point[] {
    return ($state.snapshot(this.objekt(art, id)?.outline ?? []) as Point[]).map((p) => ({ ...p }));
  }

  get gewaehltesDach(): RoofPlane | undefined {
    return this.auswahl?.art === "dach" ? this.dach(this.auswahl.id) : undefined;
  }
  get gewaehltesHindernis(): Obstacle | undefined {
    return this.auswahl?.art === "hindernis" ? this.hindernis(this.auswahl.id) : undefined;
  }
  /** Gewählte Dachfläche oder gewähltes Hindernis */
  get gewaehltesObjekt(): RoofPlane | Obstacle | undefined {
    return this.auswahl ? this.objekt(this.auswahl.art, this.auswahl.id) : undefined;
  }

  private merken() {
    this.verlauf.merken(this.stand());
    this.kannZurueck = true;
    this.kannVor = false;
  }
  private stand(): Stand {
    return { roofs: $state.snapshot(this.projekt.roofs) as RoofPlane[], obstacles: $state.snapshot(this.projekt.obstacles) as Obstacle[] };
  }
  private geaendert() {
    this.beiAenderung($state.snapshot(this.projekt) as Project);
  }

  schalteModule() {
    this.moduleSichtbar = !this.moduleSichtbar;
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
    this.entwurf = [];
    this.rechteckStart = null;
    if (w !== "auswahl") this.auswahl = null;
  }

  waehleDach(id: string | null) {
    this.auswahl = id ? { art: "dach", id, punkt: null } : null;
  }
  waehleHindernis(id: string | null) {
    this.auswahl = id ? { art: "hindernis", id, punkt: null } : null;
  }
  waehlePunkt(art: ObjektArt, id: string, punkt: number | null) {
    this.auswahl = { art, id, punkt };
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
    this.rechteckStart = null;
  }
  /** Schließt den Entwurf zu einer Dachfläche oder (mit dem Hindernis-Werkzeug) zu einem Hindernis (mindestens 3 Ecken). */
  entwurfAbschliessen(): RoofPlane | Obstacle | null {
    if (this.entwurf.length < 3) return null;
    if (this.werkzeug === "hindernis") return this.hindernisAnlegen(this.entwurf);
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
    this.auswahl = { art: "dach", id: dach.id, punkt: null };
    this.geaendert();
    return dach;
  }

  // ----- Hindernisse -----
  /** Legt ein Hindernis an, wählt es und wechselt zur Auswahl. */
  hindernisAnlegen(outline: Point[]): Obstacle {
    this.merken();
    const o: Obstacle = { id: crypto.randomUUID(), art: "kamin", outline: outline.map((p) => ({ ...p })), bufferM: 0, abziehen: true };
    this.projekt.obstacles.push(o);
    this.entwurf = [];
    this.rechteckStart = null;
    this.werkzeug = "auswahl";
    this.auswahl = { art: "hindernis", id: o.id, punkt: null };
    this.geaendert();
    return o;
  }
  /** Zweiter Antippen-Punkt des Rechtecks; zu kleine Rechtecke (unter 5 cm) werden verworfen. */
  rechteckAbschliessen(b: Point): Obstacle | null {
    const s = this.rechteckStart;
    if (!s) return null;
    const umriss = rechteckAusDiagonale(s.p, b, s.winkel);
    if (abstand(umriss[0]!, umriss[1]!) < 0.05 || abstand(umriss[0]!, umriss[3]!) < 0.05) {
      this.rechteckStart = null;
      return null;
    }
    return this.hindernisAnlegen(umriss);
  }
  setzeHindernisArt(id: string, art: ObstacleArt) {
    const o = this.hindernis(id);
    if (!o || o.art === art) return;
    this.merken();
    o.art = art;
    this.geaendert();
  }
  setzeHindernisPuffer(id: string, m: number) {
    const o = this.hindernis(id);
    if (!o || o.bufferM === m) return;
    this.merken();
    o.bufferM = m;
    this.geaendert();
  }
  setzeHindernisAbziehen(id: string, ja: boolean) {
    const o = this.hindernis(id);
    if (!o || o.abziehen === ja) return;
    this.merken();
    o.abziehen = ja;
    this.geaendert();
  }
  /** Dreht ein Hindernis um seinen Schwerpunkt. */
  drehe(id: string, grad: number) {
    const o = this.hindernis(id);
    if (!o) return;
    this.merken();
    const u = $state.snapshot(o.outline) as Point[];
    o.outline = drehen(u, schwerpunkt(u), grad);
    this.geaendert();
  }

  // ----- Ändern -----
  /** Beginn einer Ziehbewegung: Stand für „Rückgängig“ merken. */
  ziehenBeginn() {
    this.merken();
  }
  punktSetzen(art: ObjektArt, id: string, index: number, p: Point) {
    const d = this.objekt(art, id);
    if (d?.outline[index]) d.outline[index] = { ...p };
  }
  umrissSetzen(art: ObjektArt, id: string, outline: Point[]) {
    const d = this.objekt(art, id);
    if (d) d.outline = outline.map((p) => ({ ...p }));
  }
  ziehenEnde() {
    this.geaendert();
  }
  /** Fügt in der Mitte der Kante `kante` (von Punkt kante zu kante+1) einen Punkt ein und wählt ihn. */
  kanteTeilen(art: ObjektArt, id: string, kante: number, p: Point) {
    const d = this.objekt(art, id);
    if (!d) return;
    this.merken();
    d.outline = punktEinfuegen($state.snapshot(d.outline) as Point[], kante, p);
    this.auswahl = { art, id, punkt: kante + 1 };
    this.geaendert();
  }
  punktEntfernen() {
    const a = this.auswahl;
    const d = this.gewaehltesObjekt;
    if (!a || a.punkt === null || !d || d.outline.length <= 3) return;
    this.merken();
    d.outline = punktLoeschen($state.snapshot(d.outline) as Point[], a.punkt);
    this.auswahl = { art: a.art, id: a.id, punkt: null };
    this.geaendert();
  }
  /** Entfernt die gewählte Dachfläche oder das gewählte Hindernis. */
  objektEntfernen() {
    const a = this.auswahl;
    if (!a) return;
    this.merken();
    if (a.art === "dach") this.projekt.roofs = this.projekt.roofs.filter((r) => r.id !== a.id);
    else this.projekt.obstacles = this.projekt.obstacles.filter((o) => o.id !== a.id);
    this.auswahl = null;
    this.geaendert();
  }
  /** Verschiebt das gewählte Objekt um (dx, dy) Meter. */
  verschiebeObjekt(art: ObjektArt, id: string, dx: number, dy: number) {
    const d = this.objekt(art, id);
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
  setzeStringLaenge(n: number | null) {
    this.projekt.settings.stringLaenge = n !== null && Number.isInteger(n) && n >= 1 && n <= 60 ? n : null;
    this.geaendert();
  }
  setzeStringGleichLang(b: boolean) {
    this.projekt.settings.stringGleichLang = b;
    this.geaendert();
  }
  /** Projektdaten (Name, Kunde, Adresse, Notiz, Bearbeiter) ändern; nicht Teil von „Rückgängig“. */
  setzeProjektdaten(d: { name?: string; kundeName?: string; adresseText?: string; notiz?: string; bearbeiter?: string }) {
    const p = this.projekt;
    if (d.name !== undefined) p.name = d.name;
    if (d.kundeName !== undefined) p.kunde.name = d.kundeName;
    if (d.adresseText !== undefined) p.adresse.text = d.adresseText;
    if (d.notiz !== undefined) p.kunde.notiz = d.notiz;
    if (d.bearbeiter !== undefined) p.bearbeiter = d.bearbeiter;
    this.geaendert();
  }
  setzeAusrichtungsModus(o: Ausrichtung) {
    this.projekt.settings.orientation = o;
    this.geaendert();
  }

  // ----- Rückgängig / Wiederholen -----
  private uebernehmen(stand: Stand | null) {
    if (!stand) return;
    this.projekt.roofs = stand.roofs;
    this.projekt.obstacles = stand.obstacles;
    const a = this.auswahl;
    if (a) {
      const o = this.objekt(a.art, a.id);
      if (!o) this.auswahl = null;
      else if (a.punkt !== null && a.punkt >= o.outline.length) this.auswahl = { art: a.art, id: a.id, punkt: null };
    }
    this.kannZurueck = this.verlauf.kannZurueck;
    this.kannVor = this.verlauf.kannVor;
    this.geaendert();
  }
  rueckgaengig() {
    this.uebernehmen(this.verlauf.rueckgaengig(this.stand()));
  }
  wiederholen() {
    this.uebernehmen(this.verlauf.wiederholen(this.stand()));
  }
}
