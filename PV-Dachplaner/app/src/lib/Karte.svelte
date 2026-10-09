<script lang="ts">
  import { onMount } from "svelte";
  import maplibregl from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";
  import { WMS_DOP } from "./bildflug";

  interface Props {
    /** Mittelpunkt beim Start [Länge, Breite] */
    center?: [number, number];
    zoom?: number;
    /** Wird nach jeder Bewegung der Karte aufgerufen (Mittelpunkt und Zoomstufe). */
    onMove?: (c: { lng: number; lat: number; zoom: number }) => void;
    /** Wird einmal aufgerufen, sobald der Kartenstil geladen ist (Ebenen dürfen dann hinzugefügt werden). */
    onReady?: (map: maplibregl.Map) => void;
  }
  let { center = [8.5325, 52.0302], zoom = 17, onMove, onReady }: Props = $props();

  let container: HTMLDivElement;
  let map: maplibregl.Map | undefined;

  /** Luftbild: JPEG (12-mal kleiner als PNG, Spike S1), 512-px-Kacheln, höchste sinnvolle Stufe 19 (ca. 9 cm je Pixel). */
  const kachelUrl =
    `${WMS_DOP}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=nw_dop_rgb&STYLES=&CRS=EPSG:3857` +
    `&BBOX={bbox-epsg-3857}&WIDTH=512&HEIGHT=512&FORMAT=image/jpeg`;

  onMount(() => {
    map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          luftbild: {
            type: "raster",
            tiles: [kachelUrl],
            tileSize: 512,
            minzoom: 8,
            maxzoom: 19,
            attribution: "© Geobasis NRW (dl-de/zero-2.0)",
          },
        },
        layers: [
          { id: "grund", type: "background", paint: { "background-color": "#1b1d21" } },
          { id: "luftbild", type: "raster", source: "luftbild" },
        ],
      },
      center,
      zoom,
      maxZoom: 21,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("moveend", () => {
      const c = map!.getCenter();
      onMove?.({ lng: c.lng, lat: c.lat, zoom: map!.getZoom() });
    });
    map.once("load", () => {
      onMove?.({ lng: center[0], lat: center[1], zoom });
      onReady?.(map!);
    });
    // Für Tests und spätere Bausteine erreichbar
    (window as unknown as { __karte?: maplibregl.Map }).__karte = map;
    return () => map?.remove();
  });
</script>

<div bind:this={container} class="karte" data-testid="karte"></div>

<style>
  .karte { position: absolute; inset: 0; }
</style>
