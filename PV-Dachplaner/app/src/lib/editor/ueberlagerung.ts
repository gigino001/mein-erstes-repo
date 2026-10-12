import type maplibregl from "maplibre-gl";
import type { Point } from "@pv-dachplaner/geometry-core";
import { lngLatToUtm, utmToLngLat } from "../coords";
import { ausrichtungVonKante, kantenMitte, kantenWinkel, naechsteKante, punktInVieleck } from "./geom";
import { einrasten } from "./einrasten";
import { stringFarbe } from "../strings";
import type { EditorZustand, ObjektArt } from "./zustand.svelte";

/** Trefferradius in Bildschirmpixeln (Finger). */
const TREFFER_PX = 22;
/** Bis zu dieser Bewegung zählt eine Berührung noch als Tippen. */
const TIPP_PX = 8;
/** Einrastabstand in Bildschirmpixeln. */
const RASTER_PX = 14;
/** Mittelpunkt-Griffe (Kante teilen) erscheinen erst bei Kanten, die auf dem Bildschirm mindestens so lang sind. */
const MITTE_MIN_PX = 70;

const pt = (p: Point): [number, number] => {
  const l = utmToLngLat({ e: p.x, n: p.y });
  return [l.lng, l.lat];
};
const alsPunkt = (l: { lng: number; lat: number }): Point => {
  const u = lngLatToUtm(l);
  return { x: u.e, y: u.n };
};
const ring = (o: Point[]): [number, number][] => [...o.map(pt), pt(o[0]!)];

type Treffer =
  | { art: "punkt"; obj: ObjektArt; id: string; index: number }
  | { art: "mitte"; obj: ObjektArt; id: string; index: number }
  | { art: "flaeche"; obj: ObjektArt; id: string };

type Ziehen = { art: "punkt"; obj: ObjektArt; id: string; index: number } | { art: "flaeche"; obj: ObjektArt; id: string; original: Point[] };

interface Geste {
  start: { x: number; y: number };
  startPunkt: Point;
  treffer: Treffer | null;
  ziehen: Ziehen | null;
  bewegt: boolean;
  begonnen: boolean;
  /** Ausgangslage der gezogenen Ecke */
  basis?: Point;
}

/** Zeichnet Dachflächen, Hindernisse, Module, Griffe und Entwürfe als MapLibre-Ebenen und verarbeitet Tippen und Ziehen. */
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
    // Griffgrößen hängen vom Zoom ab
    map.on("zoomend", this.neuZeichnen);
  }

  private neuZeichnen = () => this.zeichnen();

  entfernen() {
    this.map.off("zoomend", this.neuZeichnen);
    for (const t of ["mousedown", "touchstart"] as const) this.map.off(t, this.runter);
    for (const t of ["mousemove", "touchmove"] as const) this.map.off(t, this.bewegen);
    for (const t of ["mouseup", "touchend", "touchcancel"] as const) this.map.off(t, this.hoch);
  }

  // ---------- Darstellung ----------

  private quellenAnlegen() {
    const leer = { type: "FeatureCollection", features: [] } as GeoJSON.FeatureCollection;
    const m = this.map;
    for (const id of ["daecher", "module", "stringlinien", "hindernisse", "griffe", "entwurf", "einrasten"]) m.addSource(id, { type: "geojson", data: leer });
    m.addLayer({ id: "dach-flaeche", type: "fill", source: "daecher", paint: { "fill-color": ["case", ["get", "gewaehlt"], "#00e5ff", "#ffd400"], "fill-opacity": ["case", ["get", "gewaehlt"], 0.28, 0.16] } });
    m.addLayer({ id: "dach-linie", type: "line", source: "daecher", paint: { "line-color": ["case", ["get", "gewaehlt"], "#00e5ff", "#ffd400"], "line-width": ["case", ["get", "gewaehlt"], 3, 2] } });
    m.addLayer({ id: "module-flaeche", type: "fill", source: "module", paint: { "fill-color": ["coalesce", ["get", "farbe"], "#1e6bff"], "fill-opacity": 0.6 } });
    m.addLayer({ id: "module-linie", type: "line", source: "module", paint: { "line-color": "#ffffff", "line-width": 1 } });
    m.addLayer({ id: "string-linie-rand", type: "line", source: "stringlinien", filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": "#000000", "line-width": 4.5, "line-opacity": 0.5 } });
    m.addLayer({ id: "string-linie", type: "line", source: "stringlinien", filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": ["get", "farbe"], "line-width": 2.5 } });
    m.addLayer({ id: "string-start", type: "circle", source: "stringlinien", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 6, "circle-color": "#ffffff", "circle-stroke-width": 3, "circle-stroke-color": ["get", "farbe"] } });
    m.addLayer({ id: "hindernis-flaeche", type: "fill", source: "hindernisse", paint: { "fill-color": ["case", ["get", "abziehen"], "#ff3b30", "#9aa0a6"], "fill-opacity": 0.45 } });
    m.addLayer({ id: "hindernis-linie", type: "line", source: "hindernisse", paint: { "line-color": ["case", ["get", "gewaehlt"], "#00e5ff", ["get", "abziehen"], "#ff3b30", "#9aa0a6"], "line-width": ["case", ["get", "gewaehlt"], 3, 2] } });
    m.addLayer({ id: "entwurf-linie", type: "line", source: "entwurf", filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": "#ffffff", "line-width": 2.5, "line-dasharray": [2, 1.5] } });
    m.addLayer({ id: "griff-mitte", type: "circle", source: "griffe", filter: ["==", ["get", "typ"], "mitte"], paint: { "circle-radius": 6, "circle-color": "#ffffff", "circle-opacity": 0.75, "circle-stroke-width": 1, "circle-stroke-color": "#00526b" } });
    m.addLayer({ id: "griff-punkt", type: "circle", source: "griffe", filter: ["==", ["get", "typ"], "punkt"], paint: { "circle-radius": ["case", ["get", "gewaehlt"], ["+", ["get", "r"], 3], ["get", "r"]], "circle-color": ["case", ["get", "gewaehlt"], "#ff9500", "#0b5fff"], "circle-stroke-width": 2.5, "circle-stroke-color": "#ffffff" } });
    m.addLayer({ id: "einrast-ziel", type: "circle", source: "einrasten", paint: { "circle-radius": 14, "circle-color": "#34c759", "circle-opacity": 0.25, "circle-stroke-width": 3, "circle-stroke-color": "#34c759" } });
    m.addLayer({ id: "entwurf-punkte", type: "circle", source: "entwurf", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": ["case", ["get", "erster"], 12, 8], "circle-color": ["case", ["get", "erster"], "#34c759", "#ffffff"], "circle-stroke-width": 2.5, "circle-stroke-color": "#0b5fff" } });
  }

  /** Aktualisiert alle Ebenen aus dem Zustand. Wird in einem `$effect` aufgerufen und ist dadurch reaktiv. */
  zeichnen() {
    const z = this.z;
    const sel = z.auswahl;
    const daecher: GeoJSON.Feature[] = z.projekt.roofs.map((r) => ({
      type: "Feature",
      properties: { id: r.id, gewaehlt: sel?.art === "dach" && r.id === sel.id },
      geometry: { type: "Polygon", coordinates: [ring(r.outline)] },
    }));
    const hindernisse: GeoJSON.Feature[] = z.projekt.obstacles.map((o) => ({
      type: "Feature",
      properties: { id: o.id, gewaehlt: sel?.art === "hindernis" && o.id === sel.id, abziehen: o.abziehen },
      geometry: { type: "Polygon", coordinates: [ring(o.outline)] },
    }));
    const sichtbar = z.moduleSichtbar ? (z.ergebnis?.daecher ?? []) : [];
    // Farbe je Modul aus der Verstringung (falls aktiv)
    const farbeJeModul = new Map<string, string>();
    const stringlinien: GeoJSON.Feature[] = [];
    if (z.moduleSichtbar && z.verstringung) {
      for (const st of z.verstringung.strings) {
        const layout = z.ergebnis?.daecher.find((d) => d.id === st.roofId)?.layout;
        if (!layout) continue;
        const farbe = stringFarbe(st.nr);
        const mitten = st.module.map((i) => {
          const c = layout.modules[i]!.corners;
          farbeJeModul.set(`${st.roofId}:${i}`, farbe);
          return pt({ x: c.reduce((a, q) => a + q.x, 0) / c.length, y: c.reduce((a, q) => a + q.y, 0) / c.length });
        });
        if (mitten.length > 1) stringlinien.push({ type: "Feature", properties: { farbe }, geometry: { type: "LineString", coordinates: mitten } });
        stringlinien.push({ type: "Feature", properties: { farbe }, geometry: { type: "Point", coordinates: mitten[0]! } });
      }
    }
    const module: GeoJSON.Feature[] = sichtbar.flatMap((e) =>
      (e.layout?.modules ?? []).map((mo, i): GeoJSON.Feature => ({
        type: "Feature",
        properties: { farbe: farbeJeModul.get(`${e.id}:${i}`) ?? null },
        geometry: { type: "Polygon", coordinates: [ring(mo.corners)] },
      })),
    );
    const griffe: GeoJSON.Feature[] = [];
    const d = z.gewaehltesObjekt;
    if (d && z.werkzeug === "auswahl") {
      const gr = this.griffe(d.outline);
      d.outline.forEach((p, i) => {
        if (gr.mitte[i]) griffe.push({ type: "Feature", properties: { typ: "mitte", index: i }, geometry: { type: "Point", coordinates: pt(kantenMitte(d.outline, i)) } });
        griffe.push({ type: "Feature", properties: { typ: "punkt", index: i, gewaehlt: i === sel?.punkt, r: Math.min(9, Math.max(5, gr.radius * 0.5)) }, geometry: { type: "Point", coordinates: pt(p) } });
      });
    }
    const entwurf: GeoJSON.Feature[] = [];
    if (z.entwurf.length > 0) {
      if (z.entwurf.length > 1) entwurf.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: z.entwurf.map(pt) } });
      z.entwurf.forEach((p, i) => entwurf.push({ type: "Feature", properties: { erster: i === 0 && z.entwurf.length >= 3 }, geometry: { type: "Point", coordinates: pt(p) } }));
    }
    if (z.rechteckStart) entwurf.push({ type: "Feature", properties: { erster: false }, geometry: { type: "Point", coordinates: pt(z.rechteckStart.p) } });
    const set = (id: string, features: GeoJSON.Feature[]) => (this.map.getSource(id) as maplibregl.GeoJSONSource).setData({ type: "FeatureCollection", features });
    set("daecher", daecher);
    set("module", module);
    set("stringlinien", stringlinien);
    set("hindernisse", hindernisse);
    set("griffe", griffe);
    set("entwurf", entwurf);
    set("einrasten", z.einrastZiel ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: pt(z.einrastZiel.punkt) } }] : []);
    this.map.getCanvas().style.cursor = z.werkzeug === "auswahl" ? "" : "crosshair";
  }

  // ---------- Einrasten ----------

  /** Meter je Bildschirmpixel in der Kartenmitte. */
  private mpp(): number {
    return (78271.51696 * Math.cos((this.map.getCenter().lat * Math.PI) / 180)) / Math.pow(2, this.map.getZoom());
  }

  /** Rastet `p` ein (wenn eingeschaltet) und merkt das Ziel für die Markierung. `ausser` ist die gerade gezogene Ecke. */
  private raste(p: Point, ausser?: { obj: ObjektArt; id: string; index: number }): Point {
    const z = this.z;
    if (!z.einrasten) {
      z.einrastZiel = null;
      return p;
    }
    const ecken: Point[] = [];
    const kanten: [Point, Point][] = [];
    const sammle = (obj: ObjektArt, id: string, umriss: Point[]) => {
      const n = umriss.length;
      umriss.forEach((q, i) => {
        const j = (i + 1) % n;
        const gezogen = ausser?.obj === obj && ausser.id === id && ausser.index === i;
        if (!gezogen) ecken.push(q);
        if (!(ausser?.obj === obj && ausser.id === id && (i === ausser.index || j === ausser.index))) kanten.push([q, umriss[j]!]);
      });
    };
    for (const r of z.projekt.roofs) sammle("dach", r.id, r.outline);
    for (const o of z.projekt.obstacles) sammle("hindernis", o.id, o.outline);
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

  /**
   * Griffgrößen für kleine Objekte: Ein Kamin ist bei Zoom 19 nur wenige Pixel groß; mit festem Trefferradius (22 px)
   * würden die Griffe das ganze Objekt überdecken. Der Radius schrumpft mit der kürzesten Kante (mindestens 8 px),
   * Mittelpunkt-Griffe gibt es nur an langen Kanten.
   */
  private griffe(umriss: Point[]): { radius: number; mitte: boolean[] } {
    const s = umriss.map((p) => this.bildschirm(p));
    const laengen = s.map((p, i) => Math.hypot(p.x - s[(i + 1) % s.length]!.x, p.y - s[(i + 1) % s.length]!.y));
    const kuerzeste = Math.min(...laengen);
    return { radius: Math.min(TREFFER_PX, Math.max(8, kuerzeste * 0.3)), mitte: laengen.map((l) => l >= MITTE_MIN_PX) };
  }

  private finde(px: { x: number; y: number }, ort: Point): Treffer | null {
    const z = this.z;
    if (z.werkzeug !== "auswahl" || z.traufeWahl) return null;
    const a = z.auswahl;
    const d = z.gewaehltesObjekt;
    if (a && d) {
      const gr = this.griffe(d.outline);
      let best: { i: number; dist: number } | null = null;
      d.outline.forEach((p, i) => {
        const s = this.bildschirm(p);
        const dist = Math.hypot(s.x - px.x, s.y - px.y);
        if (dist <= gr.radius && (!best || dist < best.dist)) best = { i, dist };
      });
      if (best) return { art: "punkt", obj: a.art, id: d.id, index: (best as { i: number }).i };
      let mitte: { i: number; dist: number } | null = null;
      d.outline.forEach((_, i) => {
        if (!gr.mitte[i]) return;
        const s = this.bildschirm(kantenMitte(d.outline, i));
        const dist = Math.hypot(s.x - px.x, s.y - px.y);
        if (dist <= gr.radius && (!mitte || dist < mitte.dist)) mitte = { i, dist };
      });
      if (mitte) return { art: "mitte", obj: a.art, id: d.id, index: (mitte as { i: number }).i };
    }
    // Hindernisse liegen über den Dachflächen
    for (let i = z.projekt.obstacles.length - 1; i >= 0; i--) {
      const o = z.projekt.obstacles[i]!;
      if (punktInVieleck(ort, o.outline)) return { art: "flaeche", obj: "hindernis", id: o.id };
    }
    for (let i = z.projekt.roofs.length - 1; i >= 0; i--) {
      const r = z.projekt.roofs[i]!;
      if (punktInVieleck(ort, r.outline)) return { art: "flaeche", obj: "dach", id: r.id };
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
      z.waehlePunkt(treffer.obj, treffer.id, treffer.index);
      this.geste.ziehen = { art: "punkt", obj: treffer.obj, id: treffer.id, index: treffer.index };
      e.preventDefault();
    } else if (treffer?.art === "flaeche" && z.auswahl?.art === treffer.obj && z.auswahl.id === treffer.id) {
      this.geste.ziehen = { art: "flaeche", obj: treffer.obj, id: treffer.id, original: z.umrissKopie(treffer.obj, treffer.id) };
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
    const zi = g.ziehen;
    if (zi.art === "punkt") {
      const o = this.z.objekt(zi.obj, zi.id)?.outline[zi.index];
      if (o) {
        // relativ zur Startposition: die Ecke springt nicht unter den Finger
        const basis = g.basis ?? (g.basis = { ...o });
        const ziel = this.raste({ x: basis.x + dx, y: basis.y + dy }, { obj: zi.obj, id: zi.id, index: zi.index });
        this.z.punktSetzen(zi.obj, zi.id, zi.index, ziel);
        const s = this.bildschirm(ziel);
        this.z.lupe = { x: s.x, y: s.y };
      }
    } else {
      this.z.umrissSetzen(zi.obj, zi.id, zi.original.map((p) => ({ x: p.x + dx, y: p.y + dy })));
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

  /** Winkel (Bogenmaß) der Kante der Dachfläche unter `ort`, die `ort` am nächsten liegt; 0 außerhalb von Dachflächen. */
  private winkelAm(ort: Point): number {
    const dach = [...this.z.projekt.roofs].reverse().find((r) => punktInVieleck(ort, r.outline));
    if (!dach) return 0;
    return kantenWinkel(dach.outline, naechsteKante(dach.outline, ort).index);
  }

  private tippen(g: Geste, _e: maplibregl.MapMouseEvent | maplibregl.MapTouchEvent) {
    const z = this.z;
    const ort = g.startPunkt;
    // Entwurf eines Vielecks (Dach oder Hindernis)
    if (z.werkzeug === "dach" || (z.werkzeug === "hindernis" && z.hindernisModus === "vieleck")) {
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
    // Hindernis als Rechteck: zwei Ecken antippen, ausgerichtet an der nächsten Dachkante
    if (z.werkzeug === "hindernis") {
      const p = this.raste(ort);
      z.einrastZiel = null;
      if (!z.rechteckStart) z.rechteckStart = { p, winkel: this.winkelAm(ort) };
      else z.rechteckAbschliessen(p);
      return;
    }
    if (z.traufeWahl) {
      const d = z.gewaehltesDach;
      if (d) {
        const k = naechsteKante(d.outline, ort);
        if (k.abstand <= 36 * this.mpp()) z.setzeAusrichtung(d.id, ausrichtungVonKante(d.outline, k.index));
      }
      return;
    }
    const t = g.treffer;
    if (!t) return z.waehleDach(null);
    if (t.art === "punkt") z.waehlePunkt(t.obj, t.id, t.index);
    else if (t.art === "mitte") {
      const d = z.objekt(t.obj, t.id)!;
      z.kanteTeilen(t.obj, t.id, t.index, kantenMitte(d.outline, t.index));
    } else if (t.obj === "dach") z.waehleDach(t.id);
    else z.waehleHindernis(t.id);
  }
}
