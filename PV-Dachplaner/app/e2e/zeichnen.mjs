// Ende-zu-Ende: Dachfläche zeichnen, Ecke ziehen, Kante teilen, Ecke löschen, Fläche verschieben, Rückgängig, Speichern.
import { base, karteBereit, pruefen, starten } from "./helfer.mjs";

const { browser, page, fehler } = await starten();
const nah = (a, b, tol) => Math.abs(a - b) <= tol;
const projekt = () => page.evaluate(() => window.__pv.projekt());
const gespeichert = () => page.waitForFunction(() => document.querySelector('[data-testid="speicherstand"]')?.textContent?.trim() === "Gespeichert");
const klick = (x, y) => page.mouse.click(x, y);
async function ziehe(von, nach, schritte = 8) {
  await page.mouse.move(von[0], von[1]);
  await page.mouse.down();
  for (let i = 1; i <= schritte; i++) await page.mouse.move(von[0] + ((nach[0] - von[0]) * i) / schritte, von[1] + ((nach[1] - von[1]) * i) / schritte);
  await page.mouse.up();
}

await page.goto(base + "/#/neu");
await karteBereit(page);
await page.getByTestId("name").fill("Zeichentest");
await page.getByTestId("anlegen").click();
await page.getByTestId("projektname").waitFor();
await karteBereit(page);
await page.waitForTimeout(500);

// Meter je Bildschirmpixel am Projektort (Web-Mercator, 512-px-Kacheln)
const mpp = await page.evaluate(() => {
  const m = window.__karte;
  return (78271.51696 * Math.cos((m.getCenter().lat * Math.PI) / 180)) / Math.pow(2, m.getZoom());
});

// 1. Dach zeichnen: Rechteck 190 x 150 Pixel
for (const [x, y] of [[100, 250], [290, 250], [290, 400], [100, 400]]) await klick(x, y);
pruefen("Hinweis nennt Ecken", /4 Ecken/.test(await page.getByTestId("hinweis").textContent()));
await page.getByTestId("fertig").click();
await page.getByTestId("dachinfo").waitFor();
const f1 = Number((await page.getByTestId("grundflaeche").textContent()).replace(",", "."));
const erwartet = 190 * 150 * mpp * mpp;
pruefen("Grundfläche entspricht den gezeichneten Pixeln", nah(f1 / erwartet, 1, 0.03), `${f1} m² gegen erwartet ${erwartet.toFixed(1)} m²`);
let p0 = await projekt();
pruefen("ein Dach D1 ohne Neigungsangabe", p0.roofs.length === 1 && p0.roofs[0].name === "D1" && p0.roofs[0].slopeDeg === null);

// 2. Ecke 0 ziehen (30 px nach rechts)
await ziehe([100, 250], [130, 250]);
let p1 = await projekt();
const dx = p1.roofs[0].outline[0].x - p0.roofs[0].outline[0].x;
pruefen("Ecke um ca. 30 Pixel nach Osten verschoben", nah(dx / (30 * mpp), 1, 0.08), `${dx.toFixed(2)} m`);
pruefen("andere Ecken unverändert", p1.roofs[0].outline[1].x === p0.roofs[0].outline[1].x);

// 3. Rückgängig und Wiederholen
await page.getByTestId("rueckgaengig").click();
let p2 = await projekt();
pruefen("Rückgängig stellt die Ecke wieder her", nah(p2.roofs[0].outline[0].x, p0.roofs[0].outline[0].x, 0.001));
await page.getByTestId("wiederholen").click();
p2 = await projekt();
pruefen("Wiederholen setzt sie erneut", nah(p2.roofs[0].outline[0].x, p1.roofs[0].outline[0].x, 0.001));

// 4. Kante teilen: weißer Mittelpunkt der Kante 0 (zwischen (130,250) und (290,250))
await klick(210, 250);
let p3 = await projekt();
pruefen("Kante teilen fügt eine Ecke ein", p3.roofs[0].outline.length === 5);
await page.getByTestId("punkt-loeschen").waitFor();
await page.getByTestId("punkt-loeschen").click();
p3 = await projekt();
pruefen("Ecke löschen entfernt sie wieder", p3.roofs[0].outline.length === 4);

// 5. Ganze Fläche verschieben (30 px nach unten = nach Süden)
const vorher = p3.roofs[0].outline[2];
await ziehe([220, 340], [220, 370]);
const p4 = await projekt();
const dy = p4.roofs[0].outline[2].y - vorher.y;
pruefen("Fläche um ca. 30 Pixel nach Süden verschoben", nah(dy / (-30 * mpp), 1, 0.08), `${dy.toFixed(2)} m`);

// 6. Speichern und Neuladen
await gespeichert();
const vorNeuladen = await projekt();
await page.reload();
await page.getByTestId("projekte").waitFor().catch(() => {});
await page.goto(base + "/#/p/" + vorNeuladen.id);
await page.reload();
await page.getByTestId("projektname").waitFor();
await karteBereit(page);
await page.waitForFunction(() => window.__pv && window.__pv.projekt().roofs.length === 1);
const nachNeuladen = await projekt();
pruefen("Dachfläche nach Neuladen unverändert", JSON.stringify(nachNeuladen.roofs) === JSON.stringify(vorNeuladen.roofs));

// 7. Zweites Dach, dann löschen
await page.getByTestId("werkzeug-dach").click();
for (const [x, y] of [[60, 120], [120, 120], [90, 180]]) await klick(x, y);
await page.getByTestId("fertig").click();
await page.getByTestId("dachinfo").waitFor();
const p5 = await projekt();
pruefen("zweites Dach heißt D2", p5.roofs.length === 2 && p5.roofs[1].name === "D2");
await page.getByTestId("dach-loeschen").click();
pruefen("Dach löschen", (await projekt()).roofs.length === 1);
await page.getByTestId("rueckgaengig").click();
pruefen("Löschen lässt sich zurücknehmen", (await projekt()).roofs.length === 2);

pruefen("keine Konsolenfehler", fehler.length === 0, fehler.join(" | "));
await page.screenshot({ path: "e2e/zeichnen.png" });
await browser.close();
