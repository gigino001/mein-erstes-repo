// Ende-zu-Ende: Projektdaten, Verstringung, PDF-Export (Inhalt per pdftotext geprüft), Paket für das CRM (ZIP mit JSON/CSV).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { base, karteBereit, pruefen, starten } from "./helfer.mjs";

const { browser, page, fehler } = await starten();
const projekt = () => page.evaluate(() => window.__pv.projekt());
const klick = (x, y) => page.mouse.click(x, y);
const text = async (id) => (await page.getByTestId(id).textContent()).trim();
const warteModule = (n) => page.waitForFunction((n) => Number(document.querySelector('[data-testid="gesamt-module"]')?.textContent) === n, n, { timeout: 15000 });
const feld = async (id, wert) => { await page.getByTestId(id).fill(wert); await page.getByTestId(id).blur(); };

await page.goto(base + "/#/neu");
await karteBereit(page);
await page.getByTestId("name").fill("Exporttest");
await page.getByTestId("anlegen").click();
await page.getByTestId("projektname").waitFor();
await karteBereit(page);
await page.waitForTimeout(500);

// Dach 185 x 150 px, 35°, Süden; Hindernis; Dach D2 ohne Neigung (soll im PDF als unvollständig erscheinen)
for (const [x, y] of [[100, 190], [285, 190], [285, 340], [100, 340]]) await klick(x, y);
await page.getByTestId("fertig").click();
await page.getByTestId("neigung-35").click();
await page.getByTestId("traufe-waehlen").click();
await klick(192, 340);
await page.getByTestId("richtung-wert").waitFor();
await warteModule(126);
await page.getByTestId("werkzeug-hindernis").click();
await klick(150, 230);
await klick(190, 270);
await page.getByTestId("hindernisinfo").waitFor();
await page.getByTestId("werkzeug-dach").click();
for (const [x, y] of [[300, 120], [340, 120], [320, 160]]) await klick(x, y);
await page.getByTestId("fertig").click();
await page.getByTestId("dachinfo").waitFor();

// Verstringung: höchstens 12 Module je String
await page.getByTestId("details-umschalten").click();
await page.getByTestId("string-laenge").fill("12");
await page.getByTestId("string-laenge").blur();
await page.getByTestId("string-info").waitFor();
const info = await text("string-info");
const modulApp = Number(await text("gesamt-module"));
const kwpApp = await text("gesamt-kwp");
pruefen("Verstringung zeigt die Zusammenfassung", /Strings?:/.test(info), info);
const proj = await projekt();
const nStrings = await page.evaluate(() => window.__pv.zustand.verstringung.strings.length);
const inStrings = await page.evaluate(() => window.__pv.zustand.verstringung.strings.reduce((a, s) => a + s.module.length, 0));
pruefen("jedes Modul liegt in genau einem String", inStrings === modulApp, `${inStrings} von ${modulApp}`);
pruefen("kein String länger als 12", await page.evaluate(() => window.__pv.zustand.verstringung.strings.every((s) => s.module.length <= 12)));
pruefen("Strings werden auf der Karte gezeichnet (Linien und Startpunkte)", (await page.evaluate(() => window.__karte.getSource("stringlinien")._data.features.length)) >= nStrings);
await page.getByTestId("details-umschalten").click();

// Export öffnen, Projektdaten eintragen
await page.getByTestId("export-oeffnen").click();
await page.getByTestId("pd-kunde").waitFor();
await feld("pd-kunde", "Max Mustermann");
await feld("pd-adresse", "Musterstraße 1, 33602 Bielefeld");
await feld("pd-bearbeiter", "Test Berater");
await feld("pd-notiz", "Dachboden zugänglich; Kamin nördlich");
const p2 = await projekt();
pruefen("Projektdaten werden im Projekt gespeichert", p2.kunde.name === "Max Mustermann" && p2.adresse.text.startsWith("Musterstraße") && p2.bearbeiter === "Test Berater" && p2.kunde.notiz.includes("Kamin"));
pruefen("Exportblatt nennt dieselbe Modulzahl wie die App", (await text("export-ergebnis")).includes(String(modulApp)));
pruefen("Hinweis auf unvollständige Dachfläche im Exportblatt", /ohne Neigung/.test(await page.locator(".blatt").textContent()));

// PDF
const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 90000 }), page.getByTestId("pdf-erstellen").click()]);
const pdfPfad = "/tmp/pv-export-test.pdf";
await dl.saveAs(pdfPfad);
await page.getByTestId("export-status").waitFor();
const status = await text("export-status");
pruefen("Status meldet das erstellte PDF", /PDF erstellt/.test(status), status);
pruefen("Dateiname enthält Adresse und Datum", /^PV-Planung_Musterstrasse_1_33602_Bielefeld_\d{4}-\d{2}-\d{2}\.pdf$/.test(dl.suggestedFilename()), dl.suggestedFilename());
const bytes = fs.readFileSync(pdfPfad);
pruefen("Datei ist ein PDF", bytes.subarray(0, 5).toString() === "%PDF-" && bytes.length > 20_000, `${(bytes.length / 1024).toFixed(0)} kB`);
const seiten = Number(execFileSync("python3", ["-c", `import pypdf,sys; print(len(pypdf.PdfReader("${pdfPfad}").pages))`]).toString().trim());
pruefen("PDF hat 5 Seiten (Deckblatt, Dachbild, Tabellen, Stringplan, String-Tabelle)", seiten === 5, `${seiten} Seiten`);
const txt = execFileSync("pdftotext", ["-layout", pdfPfad, "-"]).toString();
const kwpDe = kwpApp;
for (const [name, bed] of [
  ["Titel", /PV-Planung/.test(txt)],
  ["Projektname", /Exporttest/.test(txt)],
  ["Kunde", /Max Mustermann/.test(txt)],
  ["Adresse", /Musterstraße 1, 33602 Bielefeld/.test(txt)],
  ["Bearbeiter", /Test Berater/.test(txt)],
  ["Notiz", /Kamin nördlich/.test(txt)],
  ["Modulzahl wie in der App", new RegExp(`\\b${modulApp}\\b\\s+Module`).test(txt)],
  ["Leistung wie in der App", txt.includes(kwpDe)],
  ["Bilddatum", /Befliegung vom \d{2}\.\d{2}\.\d{4}/.test(txt)],
  ["Warnung zur unvollständigen Dachfläche", /Nicht vollständig berechnet/.test(txt) && /D2/.test(txt)],
  ["Hindernistabelle", /Kamin/.test(txt)],
  ["Haftungshinweis", /Planungshilfe/.test(txt) && /keine Gewähr/.test(txt)],
  ["Quelle", /Geobasis NRW/.test(txt)],
  ["Verstringung", /Verstringung der Module/.test(txt) && /S1/.test(txt) && /Strings im Überblick/.test(txt)],
  ["Seitenzahlen", /Seite 1 von 5/.test(txt) && /Seite 5 von 5/.test(txt)],
]) pruefen(`PDF-Text: ${name}`, bed);
// Summenzeile der Tabelle: Module in der letzten Spalte
const summe = txt.split("\n").find((z) => /^\s*Summe\s/.test(z) && !/String/.test(z));
pruefen("Summenzeile der Dachflächen-Tabelle nennt die Module", !!summe && new RegExp(`\\s${modulApp}\\s`).test(summe), summe?.trim());
// Seiten als Bilder für die Sichtprüfung
execFileSync("pdftoppm", ["-r", "60", "-png", pdfPfad, "/tmp/pv-export-seite"]);
pruefen("Seitenbilder erzeugt", fs.existsSync("/tmp/pv-export-seite-1.png") && fs.existsSync("/tmp/pv-export-seite-5.png"));

// Paket für das CRM
const [dl2] = await Promise.all([page.waitForEvent("download", { timeout: 90000 }), page.getByTestId("paket-erstellen").click()]);
const zipPfad = "/tmp/pv-export-test.zip";
await dl2.saveAs(zipPfad);
const inhalt = execFileSync("python3", ["-c", `
import zipfile, json, io
z = zipfile.ZipFile("${zipPfad}")
names = sorted(z.namelist())
j = json.loads(z.read("projekt.json"))
c = z.read("projekt.csv").decode("utf-8-sig").split("\\r\\n")
d = z.read("daecher.csv").decode("utf-8-sig").split("\\r\\n")
print(json.dumps({"names": names, "module": j["ergebnis"]["module"], "kunde": j["kunde"]["name"], "csvKopf": c[0].split(";")[:3], "csvZeile": c[1].split(";")[2:4], "daecherZeilen": len([x for x in d if x]), "pdf": z.read("planung.pdf")[:5].decode()}))
`]).toString();
const z = JSON.parse(inhalt);
pruefen("ZIP enthält PDF, JSON, CSV und Liesmich", JSON.stringify(z.names) === JSON.stringify(["LIESMICH.txt", "daecher.csv", "planung.pdf", "projekt.csv", "projekt.json"]), z.names.join(", "));
pruefen("JSON im Paket nennt dieselbe Modulzahl und den Kunden", z.module === modulApp && z.kunde === "Max Mustermann");
pruefen("CSV: Kopfzeile und Kundendaten", z.csvKopf.join(",") === "projekt_id,projekt_name,kunde_name" && z.csvZeile[0] === "Max Mustermann", JSON.stringify(z.csvZeile));
pruefen("Dachflächen-CSV: Kopf plus 2 Dachflächen", z.daecherZeilen === 3);
pruefen("PDF im Paket", z.pdf === "%PDF-");

pruefen("keine Konsolenfehler", fehler.length === 0, fehler.join(" | "));
await browser.close();
