/** Metadaten des NRW-Luftbilds (Befliegungsdatum) über GetFeatureInfo auf der Ebene `nw_dop_utm_info`. */
import type { Utm } from "./coords";

export const WMS_DOP = "https://www.wms.nrw.de/geobasis/wms_nw_dop";

export interface BildInfo {
  /** Kachelname des Bildes, z. B. 32466_5764 */
  kachel: string;
  /** Datum der Befliegung als ISO-Text (JJJJ-MM-TT) */
  datum: string;
  /** Bodenauflösung in Metern je Pixel */
  aufloesung: number;
}

/** Liest die Antwort im Format text/plain (Beispiel siehe Test). */
export function parseBildInfo(text: string): BildInfo | null {
  const wert = (name: string) => new RegExp(`${name}\\s*=\\s*'([^']*)'`).exec(text)?.[1];
  const kachel = wert("Kachelname");
  const flug = wert("Bildflugdatum");
  const aufl = wert("Bodenauflösung");
  if (!kachel || !flug) return null;
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(flug);
  if (!m) return null;
  return { kachel, datum: `${m[3]}-${m[2]}-${m[1]}`, aufloesung: aufl ? Number(aufl) : NaN };
}

export function bildInfoUrl(p: Utm): string {
  const bbox = `${p.e - 50},${p.n - 50},${p.e + 50},${p.n + 50}`;
  return (
    `${WMS_DOP}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS=nw_dop_utm_info&QUERY_LAYERS=nw_dop_utm_info` +
    `&STYLES=&CRS=EPSG:25832&BBOX=${bbox}&WIDTH=101&HEIGHT=101&I=50&J=50&INFO_FORMAT=text/plain`
  );
}

export async function ladeBildInfo(p: Utm, signal?: AbortSignal): Promise<BildInfo | null> {
  const r = await fetch(bildInfoUrl(p), { signal });
  if (!r.ok) return null;
  return parseBildInfo(await r.text());
}

/** Alter des Bildes in vollen Jahren (für die Warnung „Bild älter als 3 Jahre“). */
export function alterJahre(datumIso: string, heute: Date = new Date()): number {
  const d = new Date(datumIso + "T00:00:00Z");
  let jahre = heute.getUTCFullYear() - d.getUTCFullYear();
  const vorGeburtstag =
    heute.getUTCMonth() < d.getUTCMonth() || (heute.getUTCMonth() === d.getUTCMonth() && heute.getUTCDate() < d.getUTCDate());
  if (vorGeburtstag) jahre -= 1;
  return jahre;
}

export function datumDeutsch(datumIso: string): string {
  const [j, m, t] = datumIso.split("-");
  return `${t}.${m}.${j}`;
}
