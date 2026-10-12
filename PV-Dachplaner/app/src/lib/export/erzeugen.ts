import { rechne } from "../berechnung";
import { lngLatToUtm, meridiankonvergenz, utmToLngLat } from "../coords";
import type { Project } from "../model";
import { verstringen, plaeneAus, manuellAus } from "../strings";
import { APP_VERSION } from "../../lib-version";
import { aufSeitenverhaeltnis, bereichAus, ladeLuftbild, type Luftbild } from "./bild";
import { paketZip, type ExportKontext } from "./crm";
import { dateiname, erstellePdf } from "./pdf";

export interface Erzeugt {
  kontext: ExportKontext;
  pdf: Uint8Array;
  pdfName: string;
  /** false, wenn das Luftbild nicht geladen werden konnte (das PDF enthält dann einen Hinweis statt des Bildes) */
  bildOk: boolean;
}

/** Berechnet frisch aus dem Projekt (nicht aus einem möglicherweise veralteten Anzeigestand) und erzeugt Kontext für den Export. */
export function kontextAus(p: Project, jetzt = new Date()): ExportKontext {
  const ergebnis = rechne(p);
  const sp = verstringen(ergebnis, plaeneAus(p), p.settings.stringBereich, manuellAus(p));
  const strings = sp.strings.length > 0 ? sp : null;
  return { projekt: p, ergebnis, strings, erstelltAm: jetzt, version: APP_VERSION };
}

/** Erzeugt das PDF. `fortschritt` bekommt kurze Texte für die Anzeige. */
export async function erzeugePdf(p: Project, fortschritt: (t: string) => void = () => {}): Promise<Erzeugt> {
  const kontext = kontextAus(p);
  let bild: Luftbild | null = null;
  const b = bereichAus(p, 5);
  if (b) {
    fortschritt("Luftbild wird geladen …");
    try {
      // sehr breite oder hohe Ausschnitte auf ein ausgewogenes Seitenverhältnis bringen
      const verh = (b.maxE - b.minE) / (b.maxN - b.minN);
      const angepasst = verh > 1.5 ? aufSeitenverhaeltnis(b, 1.5) : verh < 0.8 ? aufSeitenverhaeltnis(b, 0.8) : b;
      bild = await ladeLuftbild(angepasst);
    } catch {
      bild = null;
    }
  }
  fortschritt("PDF wird erstellt …");
  const mitte = utmToLngLat({ e: ((b?.minE ?? 0) + (b?.maxE ?? 0)) / 2 || (p.adresse.position?.e ?? 0), n: ((b?.minN ?? 0) + (b?.maxN ?? 0)) / 2 || (p.adresse.position?.n ?? 0) });
  const nordDrehung = Number.isFinite(mitte.lat) ? -meridiankonvergenz(mitte) : 0;
  const pdf = await erstellePdf({ projekt: p, ergebnis: kontext.ergebnis, strings: kontext.strings, bild, erstelltAm: kontext.erstelltAm, version: kontext.version, nordDrehung });
  return { kontext, pdf, pdfName: dateiname(p, kontext.erstelltAm), bildOk: bild !== null || !b };
}

export async function erzeugePaket(p: Project, fortschritt?: (t: string) => void) {
  const e = await erzeugePdf(p, fortschritt);
  const name = e.pdfName.replace(/\.pdf$/, ".zip");
  return { ...e, zip: paketZip(e.kontext, e.pdf), zipName: name };
}

export { lngLatToUtm };
