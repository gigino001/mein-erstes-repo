// Ende-zu-Ende: Hindernisse einzeichnen (Rechteck, Vieleck), Art, Puffer, abziehen, Drehen, Verschieben, Löschen, Rückgängig, Speichern.
import { base, karteBereit, pruefen, starten } from "./helfer.mjs";

const { browser, page, fehler } = await starten();
const projekt = () => page.evaluate(() => window.__pv.projekt());
const ergebnis = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__pv.zustand.ergebnis)));
const klick = (x, y) => page.mouse.click(x, y);
const text = async (id) => (await page.getByTestId(id).textContent()).trim();
const modulzahl = async () => Number(await text("gesamt-module"));
const warteModule = (pred, n) => page.waitForFunction(([pred, n]) => { const m = Number(document.querySelector('[data-testid="gesamt-module"]')?.textContent); return pred === "=" ? m === n : pred === "<" ? m < n : pred === ">" ? m > n : m <= n; }, [pred, n], { timeout: 10000 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
async function ziehe(von, nach, schritte = 8) {
  await page.mouse.move(von[0], von[1]);
  await page.mouse.down();
  for (let i = 1; i <= schritte; i++) await page.mouse.move(von[0] + ((nach[0] - von[0]) * i) / schritte, von[1] + ((nach[1] - von[1]) * i) / schritte);
  await page.mouse.up();
}
/** Überschneiden sich zwei konvexe Vierecke (Trennachsen-Test, Berühren erlaubt)? */
const ueberlappen = (a, b, eps = 1e-6) => {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const nx = q.y - p.y, ny = -(q.x - p.x);
      const proj = (r) => r.map((v) => v.x * nx + v.y * ny);
      const pa = proj(a), pb = proj(b);
      const l = Math.hypot(nx, ny);
      if (Math.max(...pa) <= Math.min(...pb) + eps * l || Math.max(...pb) <= Math.min(...pa) + eps * l) return false;
    }
  }
  return true;
};

await page.goto(base + "/#/neu");
await karteBereit(page);
await page.getByTestId("anlegen").click();
await page.getByTestId("projektname").waitFor();
await karteBereit(page);
await page.waitForTimeout(500);
const mpp = await page.evaluate(() => (78271.51696 * Math.cos((window.__karte.getCenter().lat * Math.PI) / 180)) / Math.pow(2, window.__karte.getZoom()));

// Dach 185 x 150 px, 35°, Süden
for (const [x, y] of [[100, 190], [285, 190], [285, 340], [100, 340]]) await klick(x, y);
await page.getByTestId("fertig").click();
await page.getByTestId("neigung-35").click();
await page.getByTestId("traufe-waehlen").click();
await klick(192, 340);
await page.getByTestId("richtung-wert").waitFor();
await warteModule("=", 126);
const ohne = await modulzahl();
pruefen("Ausgangslage: 126 Module", ohne === 126);

// 1. Hindernis als Rechteck 40 x 40 px
await page.getByTestId("werkzeug-hindernis").click();
pruefen("Hinweis erklärt das Rechteck", /Ecke/.test(await text("hinweis")));
await klick(150, 230);
pruefen("nach der ersten Ecke: Hinweis zur gegenüberliegenden", /gegenüberliegende/.test(await text("hinweis")));
await klick(190, 270);
await page.getByTestId("hindernisinfo").waitFor();
let p = await projekt();
pruefen("ein Hindernis angelegt", p.obstacles.length === 1 && p.obstacles[0].art === "kamin" && p.obstacles[0].abziehen === true);
const o = p.obstacles[0].outline;
const b = dist(o[0], o[1]), h = dist(o[0], o[3]);
pruefen("Seitenlängen entsprechen den angetippten 40 Pixeln", Math.abs(b / (40 * mpp) - 1) < 0.03 && Math.abs(h / (40 * mpp) - 1) < 0.03, `${b.toFixed(2)} × ${h.toFixed(2)} m`);
pruefen("Rechteck ist rechtwinklig", Math.abs((o[1].x - o[0].x) * (o[3].x - o[0].x) + (o[1].y - o[0].y) * (o[3].y - o[0].y)) < 1e-6);
await warteModule("<", 126);
const mit = await modulzahl();
const tiefeObst = h / Math.cos((35 * Math.PI) / 180);
const grenze = (Math.ceil(b / 1.15) + 1) * (Math.ceil(tiefeObst / 1.78) + 1);
pruefen(`Modulzahl sinkt, aber höchstens um die berührten Felder (${mit} statt 126, Grenze ${grenze})`, mit < 126 && mit >= 126 - grenze);
let erg = await ergebnis();
const verlust = erg.daecher[0].layout.obstacleLossM2;
const erwartet = (b * h) / Math.cos((35 * Math.PI) / 180);
pruefen("Flächenverlust = Hindernisfläche / cos(Neigung)", Math.abs(verlust / erwartet - 1) < 0.02, `${verlust.toFixed(2)} m² gegen ${erwartet.toFixed(2)} m²`);
const hindernisOben = o;
const alleOk = erg.daecher[0].layout.modules.every((m) => !ueberlappen(m.corners, hindernisOben));
pruefen("kein Modul liegt auf dem Hindernis", alleOk);
await page.getByTestId("details-umschalten").click();
pruefen("Details nennen den Hindernis-Verlust", /Hindernisse −\d/.test(await text("ergebnis-D1")));
await page.getByTestId("details-umschalten").click();

// 2. Art und Puffer
await page.getByTestId("hindernis-art").selectOption("dachfenster");
pruefen("Art geändert", (await projekt()).obstacles[0].art === "dachfenster");
await page.getByTestId("puffer-0.3").click();
await page.waitForFunction((v) => window.__pv.zustand.ergebnis?.daecher[0]?.layout?.obstacleLossM2 > v * 1.2, verlust, { timeout: 10000 });
const mitPuffer = await modulzahl();
erg = await ergebnis();
pruefen("Abstand 30 cm vergrößert den Abzug und senkt die Modulzahl nicht", mitPuffer <= mit && erg.daecher[0].layout.obstacleLossM2 > verlust * 1.2, `${mitPuffer} Module, ${erg.daecher[0].layout.obstacleLossM2.toFixed(1)} m²`);
const mitPufferModule = erg.daecher[0].layout.modules;
// Abstand zum Hindernis mindestens 30 cm in der Dachebene (Bogenmaß der Neigung nur in Fallrichtung): im Grundriss reicht ≥ 0,3 m * cos(35°)
const minAbst = Math.min(...mitPufferModule.map((m) => Math.min(...m.corners.map((c) => Math.min(...hindernisOben.map((q) => dist(c, q)))))));
pruefen("Module halten Abstand zum Hindernis", mitPufferModule.every((m) => !ueberlappen(m.corners, hindernisOben)) && minAbst > 0.1, `kleinster Eckabstand ${minAbst.toFixed(2)} m`);

// 3. nur Hinweis (nicht abziehen)
await page.getByTestId("abziehen-nein").click();
await warteModule("=", 126);
pruefen("„nicht abziehen“ gibt alle Module zurück", (await modulzahl()) === 126);
await page.getByTestId("abziehen-ja").click();
await warteModule("<", 126);

// 4. Drehen um 5°
await page.getByTestId("puffer-0").click();
const vorDrehen = (await projekt()).obstacles[0].outline;
const winkel = (r) => (Math.atan2(r[1].y - r[0].y, r[1].x - r[0].x) * 180) / Math.PI;
await page.getByTestId("drehen-links").click();
const nachDrehen = (await projekt()).obstacles[0].outline;
let dw = winkel(nachDrehen) - winkel(vorDrehen);
if (dw > 180) dw -= 360; if (dw < -180) dw += 360;
pruefen("Drehen um 5° nach links", Math.abs(dw - 5) < 0.01, `${dw.toFixed(3)}°`);
pruefen("Drehen erhält die Fläche", Math.abs(dist(nachDrehen[0], nachDrehen[1]) * dist(nachDrehen[0], nachDrehen[3]) - b * h) < 1e-6);
await page.getByTestId("drehen-rechts").click();

// 5. Ganzes Hindernis verschieben (30 px nach rechts)
const v0 = (await projekt()).obstacles[0].outline[0];
await ziehe([170, 250], [200, 250]);
const v1 = (await projekt()).obstacles[0].outline[0];
pruefen("Hindernis um ca. 30 Pixel nach Osten verschoben", Math.abs((v1.x - v0.x) / (30 * mpp) - 1) < 0.08, `${(v1.x - v0.x).toFixed(2)} m`);

// 6. Zweites Hindernis als Vieleck (Dreieck)
await page.getByTestId("werkzeug-hindernis").click();
await page.getByTestId("modus-vieleck").click();
for (const [x, y] of [[245, 215], [275, 215], [260, 255]]) await klick(x, y);
await page.getByTestId("fertig").click();
p = await projekt();
pruefen("Vieleck-Hindernis mit 3 Ecken", p.obstacles.length === 2 && p.obstacles[1].outline.length === 3);

// 7. Löschen und Rückgängig
await page.getByTestId("hindernis-loeschen").click();
pruefen("Hindernis löschen", (await projekt()).obstacles.length === 1);
await page.getByTestId("rueckgaengig").click();
pruefen("Löschen zurücknehmen", (await projekt()).obstacles.length === 2);

// 8. Speichern und Neuladen
await page.waitForFunction(() => document.querySelector('[data-testid="speicherstand"]')?.textContent?.trim() === "Gespeichert");
const vorher = await projekt();
const zahlVorher = await modulzahl();
await page.reload();
await page.getByTestId("projektname").waitFor();
await karteBereit(page);
await page.waitForFunction(() => Number(document.querySelector('[data-testid="gesamt-module"]')?.textContent) > 0, null, { timeout: 10000 });
const nachher = await projekt();
pruefen("Hindernisse nach Neuladen unverändert", JSON.stringify(nachher.obstacles) === JSON.stringify(vorher.obstacles));
pruefen("gleiche Modulzahl nach Neuladen", (await modulzahl()) === zahlVorher, `${await modulzahl()} gegen ${zahlVorher}`);

pruefen("keine Konsolenfehler", fehler.length === 0, fehler.join(" | "));
await page.screenshot({ path: "e2e/hindernisse.png" });
await browser.close();
