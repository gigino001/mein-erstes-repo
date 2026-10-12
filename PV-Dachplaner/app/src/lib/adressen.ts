/** Adresssuche über den eigenen Index aus den amtlichen Hauskoordinaten (siehe packages/geo-data). */

export interface GemeindeInfo {
  key: string;
  gmd: string;
  kreis: string;
  strassen: number;
  adressen: number;
}

export interface GemeindeDaten {
  e0: number;
  n0: number;
  /** Straße → Liste [Hausnummer, Zusatz, Ost-Versatz in dm, Nord-Versatz in dm] */
  s: Record<string, [string, string, number, number][]>;
}

export interface Adresse {
  /** Anzeigetext, z. B. „Herforder Straße 12a, Bielefeld“ */
  text: string;
  gemeinde: string;
  strasse: string;
  nummer: string;
  /** EPSG:25832 */
  e: number;
  n: number;
}

/** Quelle der Daten; in Tests ersetzbar. */
export interface Lader {
  gemeinden(): Promise<GemeindeInfo[]>;
  daten(key: string): Promise<GemeindeDaten>;
}

/** Vergleichsschlüssel: klein, ohne Umlaute/ß/Satzzeichen, „Straße/Strasse/Str.“ vereinheitlicht. */
export function schluessel(s: string): string {
  let k = s.toLowerCase().replace(/ß/g, "ss").replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u");
  k = k.replace(/[^a-z0-9]/g, "");
  k = k.replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
  k = k.replace(/(strasse|str)$/, "str");
  k = k.replace(/str(?=[a-z0-9])/g, "str");
  return k;
}

/** Bearbeitungsabstand (Levenshtein) mit Abbruch, wenn er `grenze` übersteigt. */
export function abstandText(a: string, b: string, grenze = 2): number {
  if (Math.abs(a.length - b.length) > grenze) return grenze + 1;
  let vor = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const zeile = [i];
    for (let j = 1; j <= b.length; j++) zeile.push(Math.min(vor[j]! + 1, zeile[j - 1]! + 1, vor[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)));
    vor = zeile;
  }
  return vor[b.length]!;
}

export interface Eingabe {
  /** Teile der Straße (ohne Hausnummer und Ort) */
  strasse: string[];
  nummer: { zahl: string; zusatz: string } | null;
  /** Ort, falls am Ende der Eingabe erkannt */
  gemeinde: GemeindeInfo | null;
}

/** Zerlegt „Herforder Str. 12 a, Bielefeld“ in Straße, Hausnummer und (falls vorhanden) Ort. Postleitzahlen werden ignoriert. */
export function zerlege(text: string, gemeinden: GemeindeInfo[]): Eingabe {
  const roh = text.trim().split(/[\s,]+/).filter(Boolean).filter((t) => !/^\d{5}$/.test(t));
  let nummer: Eingabe["nummer"] = null;
  const rest: string[] = [];
  for (let i = 0; i < roh.length; i++) {
    const t = roh[i]!;
    const m = /^(\d{1,4})([a-zA-Z]?)$/.exec(t);
    if (m && !nummer) {
      nummer = { zahl: m[1]!, zusatz: (m[2] ?? "").toLowerCase() };
      const folge = roh[i + 1];
      // „12 a“: einzelner Buchstabe hinter der Zahl gehört zur Hausnummer
      if (nummer.zusatz === "" && folge && /^[a-zA-Z]$/.test(folge)) {
        nummer.zusatz = folge.toLowerCase();
        i++;
      }
    } else rest.push(t);
  }
  let gemeinde: GemeindeInfo | null = null;
  let strasse = rest;
  for (let n = Math.min(3, rest.length - 1); n >= 1; n--) {
    const k = schluessel(rest.slice(-n).join(""));
    const g = gemeinden.find((x) => schluessel(x.gmd) === k);
    if (g) {
      gemeinde = g;
      strasse = rest.slice(0, rest.length - n);
      break;
    }
  }
  return { strasse, nummer, gemeinde };
}

export type Vorschlag =
  | { art: "gemeinde"; text: string; gemeinde: GemeindeInfo }
  | { art: "strasse"; text: string; strasse: string; gemeinde: GemeindeInfo; anzahl: number }
  | { art: "adresse"; text: string; adresse: Adresse };

/** Orte, deren Name mit der Eingabe beginnt (oder sie enthält), beste zuerst. */
export function ortVorschlaege(eingabe: string, gemeinden: GemeindeInfo[], max = 8): Vorschlag[] {
  const k = schluessel(eingabe);
  if (k.length === 0) return [];
  const mit = gemeinden.filter((g) => schluessel(g.gmd).startsWith(k));
  const enthaelt = gemeinden.filter((g) => !schluessel(g.gmd).startsWith(k) && schluessel(g.gmd).includes(k));
  return [...mit, ...enthaelt].slice(0, max).map((g) => ({ art: "gemeinde", text: `${g.gmd} (${g.kreis})`, gemeinde: g }));
}

function mitSchluesseln(d: GemeindeDaten): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const name of Object.keys(d.s)) {
    const k = schluessel(name);
    m.set(k, [...(m.get(k) ?? []), name]);
  }
  return m;
}

const nummerSort = (a: [string, string, number, number], b: [string, string, number, number]) => Number(a[0]) - Number(b[0]) || a[1].localeCompare(b[1]);

/**
 * Vorschläge für „Straße [Hausnummer]“ innerhalb einer Gemeinde. Ohne Hausnummer erscheinen Straßen,
 * mit Hausnummer die passenden Adressen der besten Straßen.
 */
export function strassenVorschlaege(eingabe: Eingabe, gemeinde: GemeindeInfo, d: GemeindeDaten, max = 8): Vorschlag[] {
  const q = schluessel(eingabe.strasse.join(""));
  if (q.length === 0) return [];
  const keys = mitSchluesseln(d);
  const alle = [...keys.keys()];
  let treffer = alle.filter((k) => k.startsWith(q));
  if (treffer.length === 0) treffer = alle.filter((k) => k.includes(q));
  if (treffer.length === 0 && q.length >= 4) {
    treffer = alle.filter((k) => abstandText(q, k, 2) <= 2);
    if (treffer.length === 0) {
      const praefix = q.slice(0, Math.max(4, q.length - 6));
      treffer = alle.filter((k) => k.startsWith(praefix));
      if (treffer.length > 3) treffer = [];
    }
  }
  treffer.sort((a, b) => a.length - b.length || a.localeCompare(b));
  const strassen = treffer.flatMap((k) => keys.get(k)!).slice(0, max);
  if (!eingabe.nummer) {
    return strassen.map((s) => ({ art: "strasse", text: `${s}, ${gemeinde.gmd}`, strasse: s, gemeinde, anzahl: d.s[s]!.length }));
  }
  const { zahl, zusatz } = eingabe.nummer;
  const out: Vorschlag[] = [];
  for (const s of strassen.slice(0, 3)) {
    const passend = [...d.s[s]!].sort(nummerSort).filter((a) => (zusatz ? a[0] === zahl && a[1].toLowerCase().startsWith(zusatz) : a[0].startsWith(zahl)));
    for (const a of passend) {
      out.push({
        art: "adresse",
        text: `${s} ${a[0]}${a[1]}, ${gemeinde.gmd}`,
        adresse: { text: `${s} ${a[0]}${a[1]}, ${gemeinde.gmd}`, gemeinde: gemeinde.gmd, strasse: s, nummer: a[0] + a[1], e: d.e0 + a[2] / 10, n: d.n0 + a[3] / 10 },
      });
      if (out.length >= max + 4) return out;
    }
  }
  return out;
}

/** Eine Eingabe in einem Feld („Straße Nr, Ort“) bis zur besten Adresse auflösen (für Enter). */
export async function loeseAuf(text: string, lader: Lader, standardOrt?: string): Promise<Adresse | null> {
  const gemeinden = await lader.gemeinden();
  const e = zerlege(text, gemeinden);
  const g = e.gemeinde ?? (standardOrt ? gemeinden.find((x) => x.key === standardOrt) ?? null : null);
  if (!g || !e.nummer) return null;
  const v = strassenVorschlaege(e, g, await lader.daten(g.key));
  const a = v.find((x) => x.art === "adresse");
  return a && a.art === "adresse" ? a.adresse : null;
}

// ---------- Laden im Browser ----------

const basis = () => (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";

/** Lädt Index und Gemeindedateien von `daten/adressen/` und merkt sie im Speicher. */
export function browserLader(): Lader {
  let index: Promise<GemeindeInfo[]> | undefined;
  const cache = new Map<string, Promise<GemeindeDaten>>();
  return {
    gemeinden() {
      index ??= fetch(`${basis()}daten/adressen/index.json`).then(async (r) => {
        if (!r.ok) throw new Error("Adressdaten nicht verfügbar");
        return ((await r.json()) as { gemeinden: GemeindeInfo[] }).gemeinden;
      });
      return index;
    },
    daten(key: string) {
      if (!cache.has(key)) {
        cache.set(
          key,
          fetch(`${basis()}daten/adressen/${key}.json`).then(async (r) => {
            if (!r.ok) throw new Error("Adressdaten der Gemeinde nicht verfügbar");
            return (await r.json()) as GemeindeDaten;
          }),
        );
      }
      return cache.get(key)!;
    },
  };
}
