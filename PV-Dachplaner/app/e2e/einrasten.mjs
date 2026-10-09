// Ende-zu-Ende: Einrasten an Ecken und Kanten, Lupe beim Ziehen, Ausschalten des Einrastens.
import { base, karteBereit, pruefen, starten } from "./helfer.mjs";

const { browser, page, fehler } = await starten();
const projekt = () => page.evaluate(() => window.__pv.projekt());
const klick = (x, y) => page.mouse.click(x, y);
async function ziehe(von, nach, { halten = false, schritte = 8 } = {}) {
  await page.mouse.move(von[0], von[1]);
  await page.mouse.down();
  for (let i = 1; i <= schritte; i++) await page.mouse.move(von[0] + ((nach[0] - von[0]) * i) / schritte, von[1] + ((nach[1] - von[1]) * i) / schritte);
  if (!halten) await page.mouse.up();
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

await page.goto(base + "/#/neu");
await karteBereit(page);
await page.getByTestId("anlegen").click();
await page.getByTestId("projektname").waitFor();
await karteBereit(page);
await page.waitForTimeout(500);
const mpp = await page.evaluate(() => (78271.51696 * Math.cos((window.__karte.getCenter().lat * Math.PI) / 180)) / Math.pow(2, window.__karte.getZoom()));

// Dach A: Rechteck
for (const [x, y] of [[80, 200], [200, 200], [200, 320], [80, 320]]) await klick(x, y);
await page.getByTestId("fertig").click();
await page.getByTestId("werkzeug-dach").click();

// Dach B: erster Punkt 8 px neben Ecke (200,200) von A, zweiter 6 px unter der Kante A (oben) bei x=140
await klick(206, 204);
await klick(140, 194);
await klick(300, 260);
await klick(280, 120);
await page.getByTestId("fertig").click();
let p = await projekt();
const A = p.roofs[0].outline, B = p.roofs[1].outline;
pruefen("erste Ecke von B rastet exakt an Ecke von A ein", dist(B[0], A[1]) < 1e-6, `Abstand ${dist(B[0], A[1]).toExponential(2)} m`);
// Punkt 2 von B muss auf der Kante A0-A1 (oben, y des Bildschirms 200) liegen: gleiche y-Koordinate wie A[0]/A[1] (nahezu)
const aufKante = Math.abs((B[1].y - A[0].y) * (A[1].x - A[0].x) - (B[1].x - A[0].x) * (A[1].y - A[0].y)) / dist(A[0], A[1]);
pruefen("zweite Ecke von B liegt auf der Kante von A", aufKante < 1e-6, `Abstand zur Kante ${aufKante.toExponential(2)} m`);
pruefen("dritte Ecke bleibt frei (kein Ziel in der Nähe)", dist(B[2], A[1]) > 5 * mpp);

// Ziehen mit Lupe: Ecke 2 von B (300,260) nach (250,330); während des Ziehens muss die Lupe sichtbar und gefüllt sein
await page.getByTestId("werkzeug-auswahl").click();
await klick(290, 200); // B wählen (liegt innerhalb von B)
await ziehe([300, 260], [250, 330], { halten: true });
const lupe = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="lupe"]');
  const c = el?.querySelector("canvas");
  if (!el || getComputedStyle(el).display === "none" || !c) return { sichtbar: false };
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  let hell = 0;
  for (let i = 0; i < d.length; i += 4 * 50) if (d[i] + d[i + 1] + d[i + 2] > 30) hell++;
  return { sichtbar: true, gefuellt: hell > 20 };
});
pruefen("Lupe erscheint beim Ziehen und zeigt das Kartenbild", lupe.sichtbar && lupe.gefuellt, JSON.stringify(lupe));
await page.mouse.up();
pruefen("Lupe verschwindet nach dem Loslassen", await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="lupe"]')).display === "none"));

// Einrasten ausschalten: Ecke 2 von B knapp neben Ecke A[2] (200,320) ziehen -> kein Einrasten
await page.getByTestId("einrasten").click();
pruefen("Schalter zeigt „aus“", (await page.getByTestId("einrasten").getAttribute("aria-pressed")) === "false");
await ziehe([250, 330], [205, 325]);
p = await projekt();
pruefen("ohne Einrasten bleibt die Ecke dort, wo man sie hinzieht", dist(p.roofs[1].outline[2], p.roofs[0].outline[2]) > 3 * mpp, `Abstand ${(dist(p.roofs[1].outline[2], p.roofs[0].outline[2]) / mpp).toFixed(1)} px`);
await page.getByTestId("einrasten").click();
await page.reload();
await page.getByTestId("projektname").waitFor();
pruefen("Einstellung „Einrasten an“ wird gemerkt", (await page.getByTestId("einrasten").getAttribute("aria-pressed")) === "true");

pruefen("keine Konsolenfehler", fehler.length === 0, fehler.join(" | "));
await browser.close();
