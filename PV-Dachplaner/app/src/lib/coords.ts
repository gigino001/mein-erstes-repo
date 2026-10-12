import proj4 from "proj4";

/** ETRS89 / UTM Zone 32N – das Koordinatensystem aller NRW-Geodaten und des Rechenkerns (Meter). */
proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

export interface Utm {
  /** Ostwert in Metern (EPSG:25832) */
  e: number;
  /** Nordwert in Metern (EPSG:25832) */
  n: number;
}

export interface LngLat {
  lng: number;
  lat: number;
}

export function utmToLngLat(p: Utm): LngLat {
  const [lng, lat] = proj4("EPSG:25832", "WGS84", [p.e, p.n]) as [number, number];
  return { lng, lat };
}

export function lngLatToUtm(p: LngLat): Utm {
  const [e, n] = proj4("WGS84", "EPSG:25832", [p.lng, p.lat]) as [number, number];
  return { e, n };
}

/** Kachelname der LoD2-/Dachflächen-Daten (1-km-Raster): `E_N` in Kilometern. */
export function kachelName(p: Utm): string {
  return `${Math.floor(p.e / 1000)}_${Math.floor(p.n / 1000)}`;
}

/**
 * Meridiankonvergenz in Grad: Winkel, um den die Nordrichtung des UTM-Gitters (Bildoberkante) von der wahren Nordrichtung abweicht.
 * Positiv östlich des Mittelmeridians (9° Ost bei Zone 32).
 */
export function meridiankonvergenz(p: LngLat): number {
  const dl = ((p.lng - 9) * Math.PI) / 180;
  return (Math.atan(Math.tan(dl) * Math.sin((p.lat * Math.PI) / 180)) * 180) / Math.PI;
}
