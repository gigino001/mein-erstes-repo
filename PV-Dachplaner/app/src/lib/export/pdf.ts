import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { Gesamt } from "../berechnung";
import { zahl } from "../berechnung";
import { himmelsrichtung } from "../format";
import type { Obstacle, Project } from "../model";
import { stringFarbe, stringZusammenfassung, type StringPlan } from "../strings";
import type { Bereich, Luftbild } from "./bild";

/** Alles, was das PDF braucht. Das Luftbild ist optional (ohne Netz entsteht ein PDF ohne Bild, mit Hinweis). */
export interface PdfDaten {
  projekt: Project;
  ergebnis: Gesamt;
  strings: StringPlan | null;
  bild: Luftbild | null;
  erstelltAm: Date;
  version: string;
  /** Konvergenz des Meridians in Grad am Projektort (Norden gegenüber der Bildoberkante), für den Nordpfeil */
  nordDrehung: number;
}

const A4 = { w: 595.28, h: 841.89 };
const RAND = 40;
const GRAU = rgb(0.4, 0.4, 0.4);
const SCHWARZ = rgb(0.1, 0.1, 0.1);
const BLAU = rgb(0.043, 0.373, 1);

// ---------- Text ----------

const WIN_ANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
/** Ersetzt Zeichen, die die Standardschrift nicht kennt (sonst bricht pdf-lib ab). */
export function sauber(s: string): string {
  return s
    .replace(/−/g, "-")
    .replace(/→/g, "->")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/≈/g, "~")
    .replace(/[ -​ ]/g, " ")
    .replace(/[^\x00-\xff]/g, (c) => (WIN_ANSI_EXTRA.has(c) ? c : "?"));
}

export function dateiname(p: Project, jetzt: Date): string {
  const stamm = (p.adresse.text || p.name || "Projekt")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
  const d = `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, "0")}-${String(jetzt.getDate()).padStart(2, "0")}`;
  return `PV-Planung_${stamm || "Projekt"}_${d}.pdf`;
}

const datumDe = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
const isoDe = (iso: string) => iso.split("-").reverse().join(".");
const farbeHex = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

function umbruch(text: string, font: PDFFont, size: number, breite: number): string[] {
  const zeilen: string[] = [];
  for (const absatz of sauber(text).split(/\r?\n/)) {
    let zeile = "";
    for (const wort of absatz.split(/\s+/).filter(Boolean)) {
      const probe = zeile ? `${zeile} ${wort}` : wort;
      if (font.widthOfTextAtSize(probe, size) <= breite) zeile = probe;
      else {
        if (zeile) zeilen.push(zeile);
        zeile = wort;
      }
    }
    zeilen.push(zeile);
  }
  return zeilen;
}

// ---------- Zeichenkontext ----------

interface Kontext {
  doc: PDFDocument;
  fett: PDFFont;
  normal: PDFFont;
  seiten: PDFPage[];
}

function neueSeite(k: Kontext): PDFPage {
  const s = k.doc.addPage([A4.w, A4.h]);
  k.seiten.push(s);
  return s;
}

function text(s: PDFPage, k: Kontext, t: string, x: number, y: number, o: { size?: number; fett?: boolean; farbe?: ReturnType<typeof rgb>; rechts?: boolean; mitte?: boolean } = {}) {
  const size = o.size ?? 10;
  const font = o.fett ? k.fett : k.normal;
  const str = sauber(t);
  const w = font.widthOfTextAtSize(str, size);
  const px = o.rechts ? x - w : o.mitte ? x - w / 2 : x;
  s.drawText(str, { x: px, y, size, font, color: o.farbe ?? SCHWARZ });
}

/** Polygon (Koordinaten in PDF-Punkten, y nach oben) füllen und umranden. */
function polygon(s: PDFPage, pts: [number, number][], o: { fuell?: ReturnType<typeof rgb>; fuellAlpha?: number; rand?: ReturnType<typeof rgb>; randBreite?: number; randAlpha?: number }) {
  if (pts.length < 3) return;
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${(A4.h - y).toFixed(2)}`).join(" ") + " Z";
  s.drawSvgPath(d, {
    x: 0,
    y: A4.h,
    color: o.fuell,
    opacity: o.fuell ? (o.fuellAlpha ?? 1) : 0,
    borderColor: o.rand,
    borderWidth: o.rand ? (o.randBreite ?? 1) : 0,
    borderOpacity: o.randAlpha ?? 1,
  });
}

// ---------- Kopf, Fuß ----------

function kopfFuss(k: Kontext, d: PdfDaten) {
  const n = k.seiten.length;
  k.seiten.forEach((s, i) => {
    text(s, k, `PV-Planung · ${d.projekt.name}`, RAND, A4.h - 28, { size: 8, farbe: GRAU });
    s.drawLine({ start: { x: RAND, y: A4.h - 33 }, end: { x: A4.w - RAND, y: A4.h - 33 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    s.drawLine({ start: { x: RAND, y: 38 }, end: { x: A4.w - RAND, y: 38 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    text(s, k, `Erstellt am ${datumDe(d.erstelltAm)} mit dem PV-Dachplaner ${d.version}. Planungshilfe, keine verbindliche Fachplanung.`, RAND, 26, { size: 7, farbe: GRAU });
    text(s, k, `Seite ${i + 1} von ${n}`, A4.w - RAND, 26, { size: 7, farbe: GRAU, rechts: true });
  });
}

// ---------- Luftbild mit Überlagerung ----------

interface Feld {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Einbettung des Bildes in ein Feld (Seitenverhältnis bleibt, zentriert). Rückgabe: Rechteck des Bildes und Maßstab in Punkt je Meter. */
function bildInFeld(feld: Feld, b: Bereich) {
  const bw = b.maxE - b.minE;
  const bh = b.maxN - b.minN;
  const s = Math.min(feld.w / bw, feld.h / bh);
  const w = bw * s;
  const h = bh * s;
  return { x: feld.x + (feld.w - w) / 2, y: feld.y + (feld.h - h) / 2, w, h, s };
}

type Modus = "module" | "strings";

function zeichneBild(k: Kontext, page: PDFPage, img: PDFImage | null, d: PdfDaten, feld: Feld, modus: Modus, beschriften: boolean) {
  const b = d.bild?.bereich;
  if (!b || !img) {
    page.drawRectangle({ x: feld.x, y: feld.y, width: feld.w, height: feld.h, color: rgb(0.93, 0.93, 0.93) });
    text(page, k, "Luftbild nicht verfügbar", feld.x + feld.w / 2, feld.y + feld.h / 2, { size: 11, farbe: GRAU, mitte: true });
    return null;
  }
  const r = bildInFeld(feld, b);
  page.drawImage(img, { x: r.x, y: r.y, width: r.w, height: r.h });
  const tf = (x: number, y: number): [number, number] => [r.x + (x - b.minE) * r.s, r.y + (y - b.minN) * r.s];

  for (const roof of d.projekt.roofs) {
    polygon(page, roof.outline.map((p) => tf(p.x, p.y)), { fuell: rgb(1, 0.83, 0), fuellAlpha: 0.14, rand: rgb(1, 0.83, 0), randBreite: 1.4 });
  }
  const proStr = new Map<string, number>(); // "dachId:modul" -> Stringnummer
  const reihenfolge = new Map<string, number>(); // "dachId:modul" -> Platz im String
  if (modus === "strings" && d.strings) {
    for (const st of d.strings.strings) st.module.forEach((m, pos) => (proStr.set(`${st.roofId}:${m}`, st.nr), reihenfolge.set(`${st.roofId}:${m}`, pos + 1)));
  }
  for (const dach of d.ergebnis.daecher) {
    dach.layout?.modules.forEach((m, i) => {
      const nr = proStr.get(`${dach.id}:${i}`);
      polygon(page, m.corners.map((p) => tf(p.x, p.y)), {
        fuell: nr ? farbeHex(stringFarbe(nr)) : BLAU,
        fuellAlpha: 0.7,
        rand: rgb(1, 1, 1),
        randBreite: 0.5,
      });
    });
  }
  const o = (ob: Obstacle) => ob.outline.map((p) => tf(p.x, p.y));
  for (const ob of d.projekt.obstacles) {
    polygon(page, o(ob), { fuell: ob.abziehen ? rgb(1, 0.23, 0.19) : rgb(0.6, 0.63, 0.65), fuellAlpha: 0.55, rand: ob.abziehen ? rgb(0.8, 0.1, 0.1) : rgb(0.4, 0.4, 0.4), randBreite: 1 });
  }

  if (modus === "strings" && d.strings) {
    // Verbindungslinien in Anschlussreihenfolge, Startpunkt, Nummern in den Modulen
    for (const st of d.strings.strings) {
      const layout = d.ergebnis.daecher.find((e) => e.id === st.roofId)?.layout;
      if (!layout) continue;
      const mitten = st.module.map((i) => {
        const c = layout.modules[i]!.corners;
        return tf(c.reduce((a, q) => a + q.x, 0) / c.length, c.reduce((a, q) => a + q.y, 0) / c.length);
      });
      for (let i = 1; i < mitten.length; i++) {
        page.drawLine({ start: { x: mitten[i - 1]![0], y: mitten[i - 1]![1] }, end: { x: mitten[i]![0], y: mitten[i]![1] }, thickness: 1.1, color: rgb(0, 0, 0), opacity: 0.75 });
      }
      const modBreite = 1.15 * r.s;
      const size = Math.max(3.5, Math.min(8, modBreite * 0.34));
      mitten.forEach(([x, y], pos) => {
        const t = String(pos + 1);
        text(page, k, t, x, y - size * 0.35, { size, mitte: true, fett: true, farbe: rgb(0, 0, 0) });
      });
      const [sx, sy] = mitten[0]!;
      page.drawCircle({ x: sx, y: sy, size: Math.max(3, modBreite * 0.2), borderColor: rgb(0, 0, 0), borderWidth: 1.2, color: rgb(1, 1, 1), opacity: 0.9 });
      // Stringname neben dem ersten Modul, mit weißem Rand zum Lesen
      const name = `S${st.nr}`;
      const gs = Math.max(6, Math.min(10, modBreite * 0.5));
      for (const [ox, oy] of [[-0.6, -0.6], [0.6, 0.6], [-0.6, 0.6], [0.6, -0.6]] as const) text(page, k, name, sx + modBreite * 0.3 + ox, sy + modBreite * 0.3 + oy, { size: gs, fett: true, farbe: rgb(1, 1, 1) });
      text(page, k, name, sx + modBreite * 0.3, sy + modBreite * 0.3, { size: gs, fett: true, farbe: rgb(0, 0, 0) });
    }
  }
  if (beschriften) {
    for (const roof of d.projekt.roofs) {
      const cx = roof.outline.reduce((a, p) => a + p.x, 0) / roof.outline.length;
      const cy = roof.outline.reduce((a, p) => a + p.y, 0) / roof.outline.length;
      const [px, py] = tf(cx, cy);
      for (const [ox, oy] of [[-0.7, -0.7], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7]] as const) text(page, k, roof.name, px + ox - 6, py + oy + 14, { size: 10, fett: true, farbe: rgb(0, 0, 0) });
      text(page, k, roof.name, px - 6, py + 14, { size: 10, fett: true, farbe: rgb(1, 1, 1) });
    }
  }

  // Maßstabsbalken (links unten im Bild)
  const breiteM = r.w / r.s;
  const stufen = [1, 2, 5, 10, 20, 50, 100];
  const laenge = [...stufen].reverse().find((l) => l <= breiteM * 0.3) ?? 1;
  const bx = r.x + 10;
  const by = r.y + 10;
  page.drawRectangle({ x: bx - 5, y: by - 5, width: laenge * r.s + 32, height: 24, color: rgb(1, 1, 1), opacity: 0.8 });
  const teile = 4;
  for (let i = 0; i < teile; i++) {
    page.drawRectangle({ x: bx + (i * laenge * r.s) / teile, y: by, width: (laenge * r.s) / teile, height: 5, color: i % 2 === 0 ? rgb(0, 0, 0) : rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
  }
  text(page, k, "0", bx, by + 8, { size: 7 });
  text(page, k, `${laenge} m`, bx + laenge * r.s + 4, by - 1, { size: 7 });
  // Nordpfeil (rechts oben, gedreht um die Meridiankonvergenz)
  const nx = r.x + r.w - 22;
  const ny = r.y + r.h - 34;
  page.drawRectangle({ x: nx - 14, y: ny - 12, width: 28, height: 40, color: rgb(1, 1, 1), opacity: 0.8 });
  const a = (d.nordDrehung * Math.PI) / 180;
  const dreh = (px: number, py: number): [number, number] => [nx + px * Math.cos(a) + py * Math.sin(a), ny + 8 - px * Math.sin(a) + py * Math.cos(a)];
  polygon(page, [dreh(0, 16), dreh(-5, -6), dreh(0, -2), dreh(5, -6)], { fuell: rgb(0, 0, 0) });
  text(page, k, "N", nx, ny + 22, { size: 9, fett: true, mitte: true });
  return r;
}

// ---------- Tabellen ----------

interface Spalte {
  titel: string;
  breite: number;
  rechts?: boolean;
}

function tabelle(k: Kontext, seite: PDFPage, y: number, x: number, spalten: Spalte[], zeilen: string[][], optionen: { fussZeile?: string[]; zeilenhoehe?: number } = {}): { seite: PDFPage; y: number } {
  const hoehe = optionen.zeilenhoehe ?? 17;
  let s = seite;
  const kopf = (yy: number) => {
    s.drawRectangle({ x, y: yy - 4, width: spalten.reduce((a, c) => a + c.breite, 0), height: hoehe, color: rgb(0.9, 0.92, 0.96) });
    let cx = x;
    for (const c of spalten) {
      text(s, k, c.titel, c.rechts ? cx + c.breite - 4 : cx + 4, yy + 1, { size: 8, fett: true, rechts: c.rechts });
      cx += c.breite;
    }
    return yy - hoehe;
  };
  y = kopf(y);
  const alle = optionen.fussZeile ? [...zeilen, optionen.fussZeile] : zeilen;
  alle.forEach((z, zi) => {
    if (y < 70) {
      s = neueSeite(k);
      y = kopf(A4.h - 60);
    }
    const fuss = optionen.fussZeile && zi === alle.length - 1;
    if (fuss) s.drawLine({ start: { x, y: y + hoehe - 4 }, end: { x: x + spalten.reduce((a, c) => a + c.breite, 0), y: y + hoehe - 4 }, thickness: 0.8, color: SCHWARZ });
    else if (zi % 2 === 1) s.drawRectangle({ x, y: y - 4, width: spalten.reduce((a, c) => a + c.breite, 0), height: hoehe, color: rgb(0.97, 0.97, 0.97) });
    let cx = x;
    spalten.forEach((c, ci) => {
      const t = z[ci] ?? "";
      text(s, k, t, c.rechts ? cx + c.breite - 4 : cx + 4, y + 1, { size: 8.5, fett: !!fuss, rechts: c.rechts });
      cx += c.breite;
    });
    y -= hoehe;
  });
  return { seite: s, y };
}

const ART_NAME: Record<string, string> = { kamin: "Kamin", dachfenster: "Dachfenster", gaube: "Gaube", antenne: "Antenne / Sat", luefter: "Lüfter", sonstiges: "Sonstiges" };

// ---------- Seiten ----------

function seiteDeckblatt(k: Kontext, d: PdfDaten, img: PDFImage | null) {
  const s = neueSeite(k);
  const g = d.ergebnis;
  const p = d.projekt;
  let y = A4.h - 78;
  text(s, k, "PV-Planung", RAND, y, { size: 26, fett: true, farbe: BLAU });
  y -= 24;
  text(s, k, p.name, RAND, y, { size: 15, fett: true });
  y -= 24;

  const adresse = p.adresse.text || (p.adresse.position ? `E ${Math.round(p.adresse.position.e)}, N ${Math.round(p.adresse.position.n)} (EPSG:25832)` : "nicht angegeben");
  const paare: [string, string][] = [
    ["Kunde", p.kunde.name || "nicht angegeben"],
    ["Adresse", adresse],
    ["Datum", datumDe(d.erstelltAm)],
    ["Bearbeiter", p.bearbeiter || "nicht angegeben"],
    ["Luftbild", p.imageDate ? `Befliegung vom ${isoDe(p.imageDate)}` : "Datum unbekannt"],
  ];
  for (const [kk, v] of paare) {
    text(s, k, kk, RAND, y, { size: 9, farbe: GRAU });
    text(s, k, v, RAND + 80, y, { size: 10 });
    y -= 15;
  }
  if (p.kunde.notiz.trim()) {
    text(s, k, "Notiz", RAND, y, { size: 9, farbe: GRAU });
    for (const z of umbruch(p.kunde.notiz, k.normal, 10, A4.w - 2 * RAND - 80).slice(0, 4)) {
      text(s, k, z, RAND + 80, y, { size: 10 });
      y -= 13;
    }
  }
  y -= 8;

  // Kennzahlen
  const kasten: [string, string][] = [
    [String(g.module), "Module"],
    [zahl(g.kWp, 2), "kWp Leistung"],
    [zahl(g.nutzbarM2), "m² nutzbare Fläche"],
    [String(p.roofs.length), p.roofs.length === 1 ? "Dachfläche" : "Dachflächen"],
  ];
  const bw = (A4.w - 2 * RAND - 3 * 10) / 4;
  kasten.forEach(([zahlText, name], i) => {
    const x = RAND + i * (bw + 10);
    s.drawRectangle({ x, y: y - 46, width: bw, height: 54, color: rgb(0.94, 0.96, 1), borderColor: rgb(0.75, 0.82, 0.95), borderWidth: 0.8 });
    text(s, k, zahlText, x + bw / 2, y - 20, { size: 20, fett: true, mitte: true, farbe: BLAU });
    text(s, k, name, x + bw / 2, y - 38, { size: 8.5, mitte: true, farbe: GRAU });
  });
  y -= 66;

  if (g.unvollstaendig > 0) {
    const fehlend = g.daecher.filter((x) => x.status !== "ok").map((x) => `${x.name}: ${x.hinweise.join(", ")}`).join("; ");
    for (const z of umbruch(`Achtung: Nicht vollständig berechnet. ${fehlend}. Diese Dachflächen sind in den Summen nicht enthalten.`, k.fett, 9, A4.w - 2 * RAND)) {
      text(s, k, z, RAND, y, { size: 9, fett: true, farbe: rgb(0.7, 0.1, 0.1) });
      y -= 12;
    }
    y -= 4;
  }
  zeichneBild(k, s, img, d, { x: RAND, y: 56, w: A4.w - 2 * RAND, h: y - 56 }, "module", true);
}

function seiteDachbild(k: Kontext, d: PdfDaten, img: PDFImage | null, modus: Modus, titel: string, unterzeile: string) {
  const s = neueSeite(k);
  text(s, k, titel, RAND, A4.h - 62, { size: 16, fett: true });
  const feld = { x: RAND, y: 150, w: A4.w - 2 * RAND, h: A4.h - 62 - 150 - 18 };
  zeichneBild(k, s, img, d, feld, modus, true);
  let y = 132;
  // Legende
  const leg: [string, ReturnType<typeof rgb>][] = modus === "module" ? [["Dachfläche", rgb(1, 0.83, 0)], ["Modul", BLAU], ["Hindernis (abgezogen)", rgb(1, 0.23, 0.19)], ["Hindernis (nur Hinweis)", rgb(0.6, 0.63, 0.65)]] : [["Dachfläche", rgb(1, 0.83, 0)], ["Hindernis", rgb(1, 0.23, 0.19)]];
  let x = RAND;
  for (const [name, farbe] of leg) {
    s.drawRectangle({ x, y: y - 1, width: 10, height: 8, color: farbe, opacity: 0.8 });
    text(s, k, name, x + 14, y, { size: 8.5 });
    x += 22 + k.normal.widthOfTextAtSize(sauber(name), 8.5) + 14;
  }
  y -= 16;
  for (const z of umbruch(unterzeile, k.normal, 8.5, A4.w - 2 * RAND)) {
    text(s, k, z, RAND, y, { size: 8.5, farbe: GRAU });
    y -= 11;
  }
  const quelle = d.projekt.imageDate ? `Luftbild: Geobasis NRW (Datenlizenz Deutschland - Zero), Befliegung ${isoDe(d.projekt.imageDate)}, Auflösung 10 cm.` : "Luftbild: Geobasis NRW (Datenlizenz Deutschland - Zero), Auflösung 10 cm.";
  for (const z of umbruch(`${quelle} Das Bild kann gegenüber dem heutigen Zustand veraltet sein (Anbauten, Neubauten, Bewuchs).`, k.normal, 8.5, A4.w - 2 * RAND)) {
    text(s, k, z, RAND, y, { size: 8.5, farbe: GRAU });
    y -= 11;
  }
}

function seiteTabellen(k: Kontext, d: PdfDaten) {
  let s = neueSeite(k);
  const p = d.projekt;
  const g = d.ergebnis;
  let y = A4.h - 62;
  text(s, k, "Dachflächen und Ergebnis", RAND, y, { size: 16, fett: true });
  y -= 28;
  const spalten: Spalte[] = [
    { titel: "Fläche", breite: 46 },
    { titel: "Neigung", breite: 48, rechts: true },
    { titel: "Ausrichtung", breite: 86 },
    { titel: "Dachfl. m²", breite: 60, rechts: true },
    { titel: "Abzug m²", breite: 58, rechts: true },
    { titel: "nutzbar m²", breite: 62, rechts: true },
    { titel: "Module", breite: 48, rechts: true },
    { titel: "kWp", breite: 47, rechts: true },
  ];
  const zeilen = p.roofs.map((r) => {
    const e = g.daecher.find((x) => x.id === r.id)!;
    const neigung = r.slopeDeg === null ? "fehlt" : `${zahl(r.slopeDeg)}°`;
    const richtung = r.azimuthDeg === null ? "fehlt" : `${zahl(r.azimuthDeg)}° (${himmelsrichtung(r.azimuthDeg)})`;
    if (!e.layout) return [r.name, neigung, richtung, "-", "-", "-", "-", "-"];
    const abzug = e.layout.marginLossM2 + e.layout.obstacleLossM2;
    return [r.name, neigung, richtung, zahl(e.layout.grossAreaM2), zahl(abzug), zahl(e.layout.usableAreaM2), String(e.layout.moduleCount), zahl(e.layout.powerKWp, 2)];
  });
  const t = tabelle(k, s, y, RAND, spalten, zeilen, { fussZeile: ["Summe", "", "", zahl(g.schraegflaecheM2), zahl(g.schraegflaecheM2 - g.nutzbarM2), zahl(g.nutzbarM2), String(g.module), zahl(g.kWp, 2)] });
  s = t.seite;
  y = t.y - 6;
  const rand = p.settings.randabstandM;
  const info = [
    `Belegung: ${p.settings.orientation === "beste" ? "beste Ausrichtung je Dachfläche (hochkant oder quer)" : p.settings.orientation}.`,
    `Randabstand zu den Dachkanten: ${rand === 0 ? "nicht berücksichtigt" : `${Math.round(rand * 100)} cm`}.`,
    "Dachfläche ist die Schrägfläche (Grundriss geteilt durch den Kosinus der Neigung). Abzug = Randabstand und Hindernisse.",
  ];
  for (const z of info) {
    for (const zz of umbruch(z, k.normal, 8.5, A4.w - 2 * RAND)) {
      text(s, k, zz, RAND, y, { size: 8.5, farbe: GRAU });
      y -= 11;
    }
  }
  y -= 14;

  // Hindernisse
  text(s, k, "Hindernisse", RAND, y, { size: 12, fett: true });
  y -= 20;
  if (p.obstacles.length === 0) {
    text(s, k, "Keine Hindernisse eingetragen.", RAND, y, { size: 9, farbe: GRAU });
    y -= 20;
  } else {
    const hz = p.obstacles.map((o, i) => {
      const a = o.outline;
      const flaeche = Math.abs(a.reduce((acc, q, j) => acc + (q.x * a[(j + 1) % a.length]!.y - a[(j + 1) % a.length]!.x * q.y), 0)) / 2;
      const mass = a.length === 4 ? `${zahl(Math.hypot(a[1]!.x - a[0]!.x, a[1]!.y - a[0]!.y))} × ${zahl(Math.hypot(a[3]!.x - a[0]!.x, a[3]!.y - a[0]!.y))} m` : `${a.length} Ecken`;
      return [String(i + 1), ART_NAME[o.art] ?? o.art, mass, `${zahl(flaeche)} m²`, o.abziehen ? "ja" : "nein (Hinweis)", o.bufferM > 0 ? `${Math.round(o.bufferM * 100)} cm` : "kein"];
    });
    const t2 = tabelle(k, s, y, RAND, [{ titel: "Nr.", breite: 34 }, { titel: "Art", breite: 100 }, { titel: "Maße", breite: 100 }, { titel: "Fläche", breite: 70, rechts: true }, { titel: "abgezogen", breite: 100 }, { titel: "Abstand", breite: 70 }], hz);
    s = t2.seite;
    y = t2.y - 10;
  }

  // Annahmen
  y -= 6;
  text(s, k, "Annahmen", RAND, y, { size: 12, fett: true });
  y -= 18;
  const annahmen = [
    "Modul: 1,15 × 1,78 m, 460 Wp. Der Fugenabstand ist in den Maßen enthalten.",
    "Module liegen in der Ebene der Dachfläche, ausgerichtet an Traufe und Gefälle, und überdecken keine abgezogenen Hindernisse.",
    "Neigung und Fallrichtung stammen aus den Eingaben im Planer; die Fallrichtung bezieht sich auf das UTM-Gitter (Abweichung zur wahren Nordrichtung in NRW unter 2,5°).",
    "Verschattung, Ertrag und Wirtschaftlichkeit sind nicht berechnet.",
  ];
  for (const a of annahmen) {
    for (const [i, z] of umbruch(a, k.normal, 9, A4.w - 2 * RAND - 12).entries()) {
      if (i === 0) text(s, k, "•", RAND + 2, y, { size: 9 });
      text(s, k, z, RAND + 12, y, { size: 9 });
      y -= 12;
    }
  }
  y -= 10;
  text(s, k, "Datenquellen und Hinweise", RAND, y, { size: 12, fett: true });
  y -= 18;
  const hinweise = [
    "Luftbild: Geobasis NRW, Digitale Orthophotos (10 cm), Datenlizenz Deutschland - Zero - Version 2.0.",
    "Dachumrisse, Neigung, Ausrichtung und Hindernisse wurden vom Bearbeiter erfasst oder bestätigt.",
    "Dieses Dokument ist eine Planungshilfe auf Grundlage von Luftbild und Eingaben. Aufmaß vor Ort, Statik, Brandschutz, Netzanschluss und elektrische Auslegung sind vom Fachbetrieb zu prüfen. Es wird keine Gewähr für die Richtigkeit übernommen.",
  ];
  for (const a of hinweise) {
    for (const z of umbruch(a, k.normal, 9, A4.w - 2 * RAND)) {
      text(s, k, z, RAND, y, { size: 9 });
      y -= 12;
    }
    y -= 3;
  }
}

function seiteStrings(k: Kontext, d: PdfDaten, img: PDFImage | null) {
  const sp = d.strings!;
  seiteDachbild(k, d, img, "strings", "Verstringung der Module", `${stringZusammenfassung(sp)}. Die Ziffern in den Modulen geben die Reihenfolge im String an, der Kreis markiert das erste Modul (Anschluss). Planungshilfe ohne elektrische Prüfung.`);
  let s = neueSeite(k);
  text(s, k, "Strings im Überblick", RAND, A4.h - 62, { size: 16, fett: true });
  const zeilen = sp.strings.map((st) => [`S${st.nr}`, st.roofName, String(st.module.length), `${zahl(st.module.length * 0.46, 2)} kWp`]);
  const t = tabelle(k, s, A4.h - 92, RAND, [{ titel: "String", breite: 70 }, { titel: "Dachfläche", breite: 120 }, { titel: "Module", breite: 80, rechts: true }, { titel: "Leistung", breite: 90, rechts: true }], zeilen, { fussZeile: ["Summe", "", String(sp.strings.reduce((a, x) => a + x.module.length, 0)), `${zahl(sp.strings.reduce((a, x) => a + x.module.length, 0) * 0.46, 2)} kWp`] });
  s = t.seite;
  let y = t.y - 14;
  const hinweis = [
    "Strings werden je Dachfläche aus benachbarten Modulen gebildet; Dachflächen mit unterschiedlicher Neigung oder Ausrichtung werden nie in einem String gemischt.",
    "Die Anordnung folgt den Modulreihen von der Traufe zum First. Spannungen, Ströme, Wechselrichterzuordnung und Leitungswege wurden nicht berechnet und sind vom Elektrofachbetrieb festzulegen.",
  ];
  for (const a of hinweis) {
    for (const z of umbruch(a, k.normal, 9, A4.w - 2 * RAND)) {
      text(s, k, z, RAND, y, { size: 9, farbe: GRAU });
      y -= 12;
    }
    y -= 3;
  }
}

/** Erzeugt das PDF und gibt die Bytes zurück. */
export async function erstellePdf(d: PdfDaten): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(sauber(`PV-Planung ${d.projekt.name}`));
  doc.setAuthor(sauber(d.projekt.bearbeiter || "PV-Dachplaner"));
  doc.setCreator("PV-Dachplaner");
  doc.setProducer("PV-Dachplaner (pdf-lib)");
  doc.setCreationDate(d.erstelltAm);
  const k: Kontext = { doc, fett: await doc.embedFont(StandardFonts.HelveticaBold), normal: await doc.embedFont(StandardFonts.Helvetica), seiten: [] };
  const img = d.bild ? await doc.embedJpg(d.bild.jpeg) : null;

  seiteDeckblatt(k, d, img);
  seiteDachbild(k, d, img, "module", "Dachbild mit Modulbelegung", `${d.ergebnis.module} Module (${zahl(d.ergebnis.kWp, 2)} kWp) auf ${d.projekt.roofs.length} ${d.projekt.roofs.length === 1 ? "Dachfläche" : "Dachflächen"}.`);
  seiteTabellen(k, d);
  if (d.strings && d.strings.strings.length > 0) seiteStrings(k, d, img);
  kopfFuss(k, d);
  return doc.save();
}
