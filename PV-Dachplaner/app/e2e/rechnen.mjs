// Ende-zu-Ende: Neigung und Fallrichtung (Traufkante antippen), Rechenkern im Browser, Modulbelegung, Randabstand, Ausrichtung.
import { base, karteBereit, pruefen, starten } from "./helfer.mjs";

const { browser, page, fehler } = await starten();
const projekt = () => page.evaluate(() => window.__pv.projekt());
const klick = (x, y) => page.mouse.click(x, y);
const text = async (id) => (await page.getByTestId(id).textContent()).trim();
const modulzahl = async () => Number(await text("gesamt-module"));
const warteModule = (n) => page.waitForFunction((n) => Number(document.querySelector('[data-testid="gesamt-module"]')?.textContent) === n, n, { timeout: 10000 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

await page.goto(base + "/#/neu");
await karteBereit(page);
await page.getByTestId("anlegen").click();
await page.getByTestId("projektname").waitFor();
await karteBereit(page);
await page.waitForTimeout(500);

// Rechteck 185 x 150 Pixel (Breite so gewählt, dass keine Modulzahl knapp an einer Rundungsgrenze liegt)
for (const [x, y] of [[100, 190], [285, 190], [285, 340], [100, 340]]) await klick(x, y);
await page.getByTestId("fertig").click();
await page.getByTestId("neigung-fehlt").waitFor();
pruefen("ohne Neigung keine Zahl, sondern Hinweis", (await text("unvollstaendig")).includes("1 Dachfläche"));
pruefen("0 Module ohne Angaben", (await modulzahl()) === 0);

// Neigung 35° über Schnellwahl, Fallrichtung über die untere Kante
await page.getByTestId("neigung-35").click();
await page.getByTestId("traufe-waehlen").click();
pruefen("Hinweis erklärt die Traufe", /Traufe/.test(await text("hinweis")));
await klick(192, 340); // untere Kante, nach Süden
await page.getByTestId("richtung-wert").waitFor();
let p = await projekt();
const az = p.roofs[0].azimuthDeg;
pruefen("untere Kante ergibt Süden (180° ± 2°; UTM-Gitter weicht minimal vom wahren Norden ab)", Math.abs(az - 180) < 2, `${az}°`);
pruefen("Anzeige nennt die Himmelsrichtung", (await text("richtung-wert")).includes("(S)"));

// unabhängige Rechnung aus den Kantenlängen des gezeichneten Rechtecks
const o = p.roofs[0].outline;
const W = dist(o[0], o[1]), H = dist(o[1], o[2]);
const tiefe = H / Math.cos((35 * Math.PI) / 180);
const hochkant = (rand) => Math.floor((W - 2 * rand) / 1.15) * Math.floor((tiefe - 2 * rand) / 1.78);
const quer = (rand) => Math.floor((W - 2 * rand) / 1.78) * Math.floor((tiefe - 2 * rand) / 1.15);
await warteModule(hochkant(0));
pruefen(`hochkant ohne Rand: ${hochkant(0)} Module (Breite ${W.toFixed(2)} m, Tiefe ${tiefe.toFixed(2)} m schräg)`, (await modulzahl()) === hochkant(0), `App: ${await modulzahl()}`);
pruefen("Leistung = Module × 460 Wp", (await text("gesamt-kwp")) === (hochkant(0) * 0.46).toFixed(2).replace(".", ","));

await page.getByTestId("details-umschalten").click();
await page.getByTestId("rand-0.2").click();
await warteModule(hochkant(0.2));
pruefen(`mit 20 cm Randabstand: ${hochkant(0.2)} Module`, (await modulzahl()) === hochkant(0.2), `App: ${await modulzahl()}`);
await page.getByTestId("rand-0.1").click();
await warteModule(hochkant(0.1));
pruefen(`mit 10 cm Randabstand: ${hochkant(0.1)} Module`, (await modulzahl()) === hochkant(0.1), `App: ${await modulzahl()}`);
await page.getByTestId("rand-0").click();
await page.getByTestId("ausrichtung-quer").click();
await warteModule(quer(0));
pruefen(`quer: ${quer(0)} Module`, (await modulzahl()) === quer(0), `App: ${await modulzahl()}`);
await page.getByTestId("ausrichtung-beste").click();
const beste = Math.max(hochkant(0), quer(0));
await warteModule(beste);
pruefen(`beste Ausrichtung: ${beste} Module`, (await modulzahl()) === beste);
await page.getByTestId("ausrichtung-hochkant").click();
await warteModule(hochkant(0));

// Anzeige der Module auf der Karte
const anzahlFlaechen = await page.evaluate(() => window.__karte.getSource("module")._data.features.length);
pruefen("Module werden auf der Karte gezeichnet", anzahlFlaechen === hochkant(0), `${anzahlFlaechen} Flächen`);

// Neigung ändern wirkt sofort; manuelle Eingabe
await page.getByTestId("neigung-eingabe").fill("20");
await page.getByTestId("neigung-eingabe").blur();
p = await projekt();
pruefen("Neigung per Eingabe (20°)", p.roofs[0].slopeDeg === 20);
const tiefe2 = H / Math.cos((20 * Math.PI) / 180);
const erwartet2 = Math.floor(W / 1.15) * Math.floor(tiefe2 / 1.78);
await warteModule(erwartet2);
pruefen(`mit 20° Neigung ${erwartet2} Module`, (await modulzahl()) === erwartet2);

// Rückgängig stellt die Neigung wieder her
await page.getByTestId("rueckgaengig").click();
p = await projekt();
pruefen("Rückgängig stellt die Neigung (35°) wieder her", p.roofs[0].slopeDeg === 35);

// Speichern und Neuladen
await page.waitForFunction(() => document.querySelector('[data-testid="speicherstand"]')?.textContent?.trim() === "Gespeichert");
const id = p.id;
await page.reload();
await page.getByTestId("projektname").waitFor();
await karteBereit(page);
await page.getByTestId("gesamt-module").waitFor();
await page.waitForFunction(() => Number(document.querySelector('[data-testid="gesamt-module"]')?.textContent) > 0, null, { timeout: 10000 });
pruefen("Ergebnis nach Neuladen wieder da", (await modulzahl()) === hochkant(0));
pruefen("Projekt-Kennung unverändert", (await projekt()).id === id);

pruefen("keine Konsolenfehler", fehler.length === 0, fehler.join(" | "));
await page.screenshot({ path: "e2e/rechnen.png" });
await browser.close();
