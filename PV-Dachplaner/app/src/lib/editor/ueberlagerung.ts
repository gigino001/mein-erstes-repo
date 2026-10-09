import type maplibregl from "maplibre-gl";
import type { Point } from "@pv-dachplaner/geometry-core";
import { lngLatToUtm, utmToLngLat } from "../coords";
import { kantenMitte, punktInVieleck } from "./geom";
import { einrasten } from "./einrasten";
import type { EditorZustand } from "./zustand.svelte";

/** Trefferradius in Bildschirmpixeln (Finger). */
const TREFFER_PX = 22;
/** Bis zu dieser Bewegung zählt eine Berührung noch als Tippen. */
const TIPP_PX = 8;
/** Einrastabstand in Bildschirmpixeln. */
const RASTER_PX = 14;

const pt = (p: Point): [number, number] => {
  const l = utmToLngLat({ e: p.x, n: p.y });
  return [l.lng, l.lat];
};
const alsPunkt = (l: { lng: number; lat: number }): Point => {
  const u = lngLatToUtm(l);
  return { x: u.e, y: u.n };
};

type Treffer = { art: "punkt"; roofId: string; index: number } | { art: "mitte"; roofId: string; index: number } | { art: "dach"; roofId: string };

interface Geste {
  start: { x: number; y: number };
  startPunkt: Point;
  treffer: Treffer | null;
  ziehen: null | { art: "punkt"; roofId: string; index: number } | { art: "dach"; roofId: string; original: Point[] };
  bewegt: boolean;
  begonnen: boolean;
  /** Ausgangslage der gezogenen Ecke */
  basis?: Point;
}

/** Zeichnet Dachflächen, Griffe und Entwurf als MapLibre-Ebenen und verarbeitet Tippen und Ziehen. */
export class Ueberlagerung {
  private geste: Geste | null = null;

  constructor(
    private map: maplibregl.Map,
    private z: EditorZustand,
  ) {
    this.quellenAnlegen();
    for (const t of ["mousedown", "touchstart"] as const) map.on(t, this.runter);
    for (const t of ["mousemove", "touchmove"] as const) map.on(t, this.bewegen);
    for (const t of ["mouseup", "touchend", "touchcancel"] as const) map.on(t, this.hoch);
  }

  entfernen() {
    for (const t of ["mousedown", "touchstart"] as const) this.map.off(t, this.runter);
    for (const t of ["mousemove", "touchmove"] as const) this.map.off(t, this.bewegen);
    for (const t of ["mouseup", "touchend", "touchcancel"] as const) this.map.off(t, this.hoch);
  }

  // ---------- Darstellung ----------

  private quellenAnlegen() {
    const leer = { type: "FeatureCollection", features: [] } as GeoJSON.FeatureCollection;
    const m = this.map;
    for (const id of ["daecher", "griffe", "entwurf", "einrasten"]) m.addSource(id, { type: "geojson", data: leer });
    m.addLayer({ id: "dach-flaeche", type: "fill", source: "daecher", paint: { "fill-color": ["case", ["get", "gewaehlt"], "#00e5ff", "#ffd400"], "fill-opacity": ["case", ["get", "gewaehlt"], 0.28, 0.16] } });
    m.addLayer({ id: "dach-linie", type: "line", source: "daecher", paint: { "line-color": ["case", ["get", "gewaehlt"], "#00e5ff", "#ffd400"], "line-width": ["case", ["get", "gewaehlt"], 3, 2] } });
    m.addLayer({ id: "entwurf-linie", type: "line", source: "entwurf", filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": "#ffffff", "line-width": 2.5, "line-dasharray": [2, 1.5] } });
    m.addLayer({ id: "griff-mitte", type: "circle", source: "griffe", filter: ["==", ["get", "typ"], "mitte"], paint: { "circle-radius": 6, "circle-color": "#ffffff", "circle-opacity": 0.75, "circle-stroke-width": 1, "circle-stroke-color": "#00526b" } });
    m.addLayer({ id: "griff-punkt", type: "circle", source: "griffe", filter: ["==", ["get", "typ"], "punkt"], paint: { "circle-radius": ["case", ["get", "gewaehlt"], 12, 9], "circle-color": ["case", ["get", "gewaehlt"], "#ff9500", "#0b5fff"], "circle-stroke-width": 2.5, "circle-stroke-color": "#ffffff" } });
    m.addLayer({ id: "einrast-ziel", type: "circle", source: "einrasten", paint: { "circle-radius": 14, "circle-color": "#34c759", "circle-opacity": 0.25, "circle-stroke-width": 3, "circle-stroke-color": "#34c759" } });
    m.addLayer({ id: "entwurf-punkte", type: "circle", source: "entwurf", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": ["case", ["get", "erster"], 12, 8], "circle-color": ["case", ["get", "erster"], "#34c759", "#ffffff"], "circle-stroke-width": 2.5, "circle-stroke-color": "#0b5fff" } });
  }

  /** Aktualisiert alle Ebenen aus dem Zustand. Wird in einem `$effect` aufgerufen und ist dadurch reaktiv. */
  zeichnen() {
    const z = this.z;
    const gewaehlt = z.auswahl?.roofId;
    const daecher: GeoJSON.Feature[] = z.projekt.roofs.map((r) => ({
      type: "Feature",
      properties: { id: r.id, gewaehlt: r.id === gewaehlt },
      geometry: { type: "Polygon", coordinates: [[...r.outline.map(pt), pt(r.outline[0]!)]] },
    }));
    const griffe: GeoJSON.Feature[] = [];
    const d = z.gewaehltesDach;
    if (d && z.werkzeug === "auswahl") {
      d.outline.forEach((p, i) => {
        griffe.push({ type: "Feature", properties: { typ: "mitte", index: i }, geometry: { type: "Point", coordinates: pt(kantenMitte(d.outline, i)) } });
        griffe.push({ type: "Feature", properties: { typ: "punkt", index: i, gewaehlt: i === z.auswahl?.punkt }, geometry: { type: "Point", coordinates: pt(p) } });
      });
    }
    const entwurf: GeoJSON.Feature[] = [];
    if (z.entwurf.length > 0) {
      if (z.entwurf.length > 1) entwurf.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: z.entwurf.map(pt) } });
      z.entwurf.forEach((p, i) => entwurf.push({ type: "Feature", properties: { erster: i === 0 && z.entwurf.length >= 3 }, geometry: { type: "Point", coordinates: pt(p) } }));
    }
    const set = (id: string, features: GeoJSON.Feature[]) => (this.map.getSource(id) as maplibregl.GeoJSONSource).setData({ type: "FeatureCollection", features });
    set("daecher", daecher);
    set("griffe", griffe);
    set("entwurf", entwurf);
    set("einrasten", z.einrastZiel ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: pt(z.einrastZiel.punkt) } }] : []);
    this.map.getCanvas().style.cursor = z.werkzeug === "dach" ? "crosshair" : "";
  }

  // ---------- Einrasten ----------

  /** Meter je Bildschirmpixel in der Kartenmitte. */
  private mpp(): number {
    return (78271.51696 * Math.cos((this.map.getCenter().lat * Math.PI) / 180)) / Math.pow(2, this.map.getZoom());
  }

  /** Rastet `p` ein (wenn eingeschaltet) und merkt das Ziel für die Markierung. `ausser` ist die gerade gezogene Ecke. */
  private raste(p: Point, ausser?: { roofId: string; index: number }): Point {
    const z = this.z;
    if (!z.einrasten) {
      z.einrastZiel = null;
      return p;
    }
    const ecken: Point[] = [];
    const kanten: [Point, Point][] = [];
    for (const r of z.projekt.roofs) {
      const n = r.outline.length;
      r.outline.forEach((q, i) => {
        const j = (i + 1) % n;
        const gezogen = ausser?.roofId === r.id && ausser.index === i;
        if (!gezogen) ecken.push(q);
        if (!(ausser?.roofId === r.id && (i === ausser.index || j === ausser.index))) kanten.push([q, r.outline[j]!]);
      });
    }
    z.entwurf.forEach((q, i) => {
      ecken.push(q);
      if (i > 0) kanten.push([z.entwurf[i - 1]!, q]);
    });
    const treffer = einrasten(p, ecken, kanten, RASTER_PX * this.mpp());
    z.einrastZiel = treffer;
    return treffer ? treffer.punkt : p;
  }

  // ---------- Treffer ----------

  private bildschirm(p: Point) {
    return this.map.project(pt(p));
  }

  private finde(px: { x: number; y: number }, ort: Point): Treffer | null {
    const z = this.z;
    const d = z.gewaehltesDach;
    if (z.werkzeug !== "auswahl") return null;
    if (d) {
      let best: { i: number; dist: number } | null = null;
      d.outline.forEach((p, i) => {
        const s = this.bildschirm(p);
        const dist = Math.hypot(s.x - px.x, s.y - px.y);
        if (dist <= TREFFER_PX && (!best || dist < best.dist)) best = { i, dist };
      });
      if (best) return { art: "punkt", roofId: d.id, index: (best as { i: number }).i };
      let mitte: { i: number; dist: number } | null = null;
      d.outline.forEach((_, i) => {
        const s = this.bildschirm(kantenMitte(d.outline, i));
        const dist = Math.hypot(s.x - px.x, s.y - px.y);
        if (dist <= TREFFER_PX && (!mitte || dist < mitte.dist)) mitte = { i, dist };
      });
      if (mitte) return { art: "mitte", roofId: d.id, index: (mitte as { i: number }).i };
    }
    for (let i = z.projekt.roofs.length - 1; i >= 0; i--) {
      const r = z.projekt.roofs[i]!;
      if (punktInVieleck(ort, r.outline)) return { art: "dach", roofId: r.id };
    }
    return null;
  }

  // ---------- Gesten ----------

  private mehrereFinger(e: maplibregl.MapMouseEvent | maplibregl.MapTouchEvent) {
    const o = e.originalEvent as TouchEvent;
    return "touches" in o && o.touches.length > 1;
  }

  private runter = (e: maplibregl.MapMouseEvent | maplibregl.MapTouchEvent) => {
    if (this.mehrereFinger(e)) {
      this.abbrechen();
      return;
    }
    const ort = alsPunkt(e.lngLat);
    const treffer = this.finde(e.point, ort);
    this.geste = { start: { x: e.point.x, y: e.point.y }, startPunkt: ort, treffer, ziehen: null, bewegt: false, begonnen: false };
    const z = this.z;
    if (treffer?.art === "punkt") {
      z.waehlePunkt(treffer.roofId, treffer.index);
      this.geste.ziehen = { art: "punkt", roofId: treffer.roofId, index: treffer.index };
      e.preventDefault();
    } else if (treffer?.art === "dach" && z.auswahl?.roofId === treffer.roofId) {
      this.geste.ziehen = { art: "dach", roofId: treffer.roofId, original: z.umrissKopie(treffer.roofId) };
      e.preventDefault();
    }
  };

  private bewegen = (e: maplibregl.MapMouseEvent | maplibregl.MapTouchEvent) => {
    const g = this.geste;
    if (!g) return;
    if (this.mehrereFinger(e)) {
      this.abbrechen();
      return;
    }
    if (!g.bewegt && Math.hypot(e.point.x - g.start.x, e.point.y - g.start.y) > TIPP_PX) g.bewegt = true;
    if (!g.ziehen || !g.bewegt) return;
    if (!g.begonnen) {
      this.z.ziehenBeginn();
      g.begonnen = true;
    }
    const jetzt = alsPunkt(e.lngLat);
    const dx = jetzt.x - g.startPunkt.x;
    const dy = jetzt.y - g.startPunkt.y;
    if (g.ziehen.art === "punkt") {
      const d = this.z.dach(g.ziehen.roofId);
      const o = d?.outline[g.ziehen.index];
      if (o) {
        // relativ zur Startposition: die Ecke springt nicht unter den Finger
        const basis = g.basis ?? (g.basis = { ...o });
        const ziel = this.raste({ x: basis.x + dx, y: basis.y + dy }, { roofId: g.ziehen.roofId, index: g.ziehen.index });
        this.z.punktSetzen(g.ziehen.roofId, g.ziehen.index, ziel);
        const s = this.bildschirm(ziel);
        this.z.lupe = { x: s.x, y: s.y };
      }
    } else {
      this.z.dachSetzen(g.ziehen.roofId, g.ziehen.original.map((p) => ({ x: p.x + dx, y: p.y + dy })));
    }
    e.preventDefault();
  };

  private hoch = (e: maplibregl.MapMouseEvent | maplibregl.MapTouchEvent) => {
    const g = this.geste;
    this.geste = null;
    if (!g) return;
    if (g.ziehen && g.begonnen) {
      this.z.einrastZiel = null;
      this.z.lupe = null;
      this.z.ziehenEnde();
      return;
    }
    if (g.bewegt) return; // Karte wurde verschoben
    this.tippen(g, e);
  };

  private abbrechen() {
    const g = this.geste;
    this.geste = null;
    this.z.einrastZiel = null;
    this.z.lupe = null;
    if (g?.ziehen && g.begonnen) this.z.ziehenEnde();
  }

  private tippen(g: Geste, e: maplibregl.MapMouseEvent | maplibregl.MapTouchEvent) {
    const z = this.z;
    const ort = g.startPunkt;
    if (z.werkzeug === "dach") {
      if (z.entwurf.length >= 3) {
        const s = this.bildschirm(z.entwurf[0]!);
        if (Math.hypot(s.x - g.start.x, s.y - g.start.y) <= TREFFER_PX) {
          z.entwurfAbschliessen();
          return;
        }
      }
      z.entwurfPunkt(this.raste(ort));
      z.einrastZiel = null;
      return;
    }
    const t = g.treffer;
    if (!t) return z.waehleDach(null);
    if (t.art === "punkt") z.waehlePunkt(t.roofId, t.index);
    else if (t.art === "mitte") {
      const d = z.dach(t.roofId)!;
      z.kanteTeilen(t.roofId, t.index, kantenMitte(d.outline, t.index));
    } else z.waehleDach(t.roofId);
    void e;
  }
}
