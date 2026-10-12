// Ende-zu-Ende: Adresse eintippen (andere Schreibweisen), Vorschläge, Enter, Karte springt zum Haus, Projekt trägt die Adresse.
import proj4 from "proj4";
import { base, karteBereit, pruefen, starten } from "./helfer.mjs";

proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
const { browser, page, fehler } = await starten({ width: 390, height: 844 });
const text = async (id) => (await page.getByTestId(id).textContent()).trim();

await page.goto(base + "/#/neu");
await karteBereit(page);
await page.getByTestId("ort").waitFor();
await page.waitForFunction(() => document.querySelector('[data-testid="ort"]').value !== "");
pruefen("Ort ist vorbelegt (Bielefeld)", (await page.getByTestId("ort").inputValue()) === "Bielefeld");

// Testadresse aus den echten Daten wählen: Straße mit „straße“ im Namen und Hausnummer 12 bis 20
const probe = await page.evaluate(async () => {
  const d = await (await fetch("/daten/adressen/11_000.json")).json();
  for (const [name, adr] of Object.entries(d.s)) {
    if (!/straße$/.test(name) || adr.length < 6) continue;
    const a = adr.find(([nr, zus]) => Number(nr) >= 12 && Number(nr) <= 20 && zus === "");
    if (a) return { strasse: name, nr: a[0], e: d.e0 + a[2] / 10, n: d.n0 + a[3] / 10 };
  }
  return null;
});
pruefen("Testadresse aus den Daten gefunden", !!probe, probe ? `${probe.strasse} ${probe.nr}` : "");
const [lng, lat] = proj4("EPSG:25832", "WGS84", [probe.e, probe.n]);
const mpp = () => page.evaluate(() => (78271.51696 * Math.cos((window.__karte.getCenter().lat * Math.PI) / 180)) / Math.pow(2, window.__karte.getZoom()));
const abstandMeter = async () => {
  const c = await page.evaluate(() => window.__karte.getCenter());
  const [e, n] = proj4("WGS84", "EPSG:25832", [c.lng, c.lat]);
  return Math.hypot(e - probe.e, n - probe.n);
};

// 1. Vorschläge beim Tippen: Anfang der Straße
const anfang = probe.strasse.slice(0, 5).toLowerCase();
await page.getByTestId("strasse").fill(anfang);
await page.getByTestId("vorschlaege").waitFor();
const erste = await page.getByTestId("vorschlaege").locator("button").count();
pruefen("Vorschläge erscheinen schon nach dem Anfang der Straße", erste > 0, `${erste} Vorschläge für „${anfang}“`);

// 2. Straße in anderer Schreibweise + Nummer, Enter
const getippt = `${probe.strasse.toLowerCase().replace("ß", "ss").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")} ${probe.nr}`;
await page.getByTestId("strasse").fill(getippt);
await page.getByTestId("vorschlaege").waitFor();
await page.getByTestId("strasse").press("Enter");
await page.getByText(/Gefunden:/).waitFor();
const gew = await text("gefunden");
pruefen("richtige Adresse gewählt", gew.includes(probe.strasse) && gew.includes(probe.nr), gew);
await page.waitForTimeout(800);
const d = await abstandMeter();
pruefen("Karte liegt auf dem Haus (Abstand unter 3 m)", d < 3, `${d.toFixed(1)} m`);
const zoom = await page.evaluate(() => window.__karte.getZoom());
pruefen("Zoomstufe 19", Math.abs(zoom - 19) < 0.01, String(zoom));

// 3. Projekt anlegen: trägt die Adresse
await page.getByTestId("anlegen").click();
await page.getByTestId("projektname").waitFor();
const name = await text("projektname");
pruefen("Projektname ist die Adresse", name.includes(probe.strasse) && name.includes(probe.nr), name);
await page.getByLabel("Zur Projektliste").click();
await page.getByTestId("projekte").waitFor();
pruefen("Projektliste zeigt die Adresse", (await text("projekte")).includes(probe.strasse));

// 4. Anderer Ort: Gütersloh wählen, Vorschlag antippen
await page.goto(base + "/#/neu");
await karteBereit(page);
await page.getByTestId("ort").fill("guet");
await page.getByTestId("ort-liste").waitFor();
await page.getByTestId("ort-liste").locator("button").first().click();
pruefen("Ort gewählt", (await page.getByTestId("ort").inputValue()) === "Gütersloh");
await page.getByTestId("strasse").fill("Berliner Str");
await page.getByTestId("vorschlaege").waitFor();
const berliner = await page.getByTestId("vorschlaege").locator("button").first().textContent();
pruefen("Vorschläge im gewählten Ort", /Berliner/.test(berliner), berliner.trim());
await page.getByTestId("vorschlaege").locator("button").first().click();
await page.getByTestId("vorschlaege").waitFor();
const nummern = await page.getByTestId("vorschlaege").locator("button").count();
pruefen("nach der Straße erscheinen Hausnummern", nummern >= 3, `${nummern} Hausnummern`);
await page.getByTestId("vorschlaege").locator("button").first().click();
await page.getByText(/Gefunden:/).waitFor();
pruefen("Adresse in Gütersloh gewählt", /Gütersloh/.test(await text("gefunden")), await text("gefunden"));

// 5. Unbekannte Adresse: Hinweis statt Absturz (Suche wieder öffnen)
await page.getByTestId("suche-umschalten").click();
await page.getByTestId("strasse").fill("Zzzzzzzzz 5");
await page.getByTestId("suchmeldung").waitFor();
pruefen("unbekannte Adresse zeigt einen Hinweis", /Nichts gefunden/.test(await text("suchmeldung")));

pruefen("keine Konsolenfehler", fehler.length === 0, fehler.join(" | "));
await page.screenshot({ path: "e2e/adresse.png" });
await browser.close();
