// Ende-zu-Ende: Strings von Hand legen (Module anklicken, nummerieren, MPPT zuweisen, Warnungen).
import { base, karteBereit, pruefen, starten } from "./helfer.mjs";

const { browser, page, fehler } = await starten();
const klick = (x, y) => page.mouse.click(x, y);
const text = async (id) => (await page.getByTestId(id).textContent()).trim();

await page.goto(base + "/#/neu");
await karteBereit(page);
await page.getByTestId("name").fill("Stringtest");
await page.getByTestId("anlegen").click();
await page.getByTestId("projektname").waitFor();
await karteBereit(page);
await page.waitForTimeout(500);

for (const [x, y] of [[100, 190], [285, 190], [285, 340], [100, 340]]) await klick(x, y);
await page.getByTestId("fertig").click();
await page.getByTestId("neigung-35").click();
await page.getByTestId("traufe-waehlen").click();
await klick(192, 340);
await page.getByTestId("richtung-wert").waitFor();
await page.waitForFunction(() => Number(document.querySelector('[data-testid="gesamt-module"]')?.textContent) === 126, null, { timeout: 15000 });

// Bildschirmposition eines Moduls aus dem Ergebnis (affine Abbildung über die Dachecken)
const pos = (i) => page.evaluate((i) => {
  const z = window.__pv.zustand;
  const o = z.projekt.roofs[0].outline;
  const lay = z.ergebnis.daecher[0].layout.modules[i].corners;
  const cx = lay.reduce((a, q) => a + q.x, 0) / lay.length, cy = lay.reduce((a, q) => a + q.y, 0) / lay.length;
  const sx = (285 - 100) / (o[1].x - o[0].x), sy = (340 - 190) / (o[0].y - o[3].y);
  return { x: 100 + (cx - o[0].x) * sx, y: 190 + (o[0].y - cy) * sy };
}, i);
const tippe = async (i) => { const p = await pos(i); await klick(p.x, p.y); await page.waitForTimeout(80); };

await page.getByTestId("werkzeug-strings").click();
await tippe(0); // wählt die Dachfläche an der Modulposition und legt einen String an
const m1 = await page.evaluate(() => window.__pv.projekt().roofs[0].stringManuell);
pruefen("erster Tipp legt einen Handplan mit einem String an", !!m1 && m1.strings.length === 1 && m1.strings[0].module.join() === "0", JSON.stringify(m1));
for (const i of [1, 2, 3]) await tippe(i);
let m = await page.evaluate(() => window.__pv.projekt().roofs[0].stringManuell);
pruefen("Module werden in Tippreihenfolge nummeriert", m.strings[0].module.join() === "0,1,2,3", m.strings[0].module.join());
await page.waitForFunction(() => document.querySelectorAll(".string-nummer").length === 4, null, { timeout: 5000 }).catch(() => {});
pruefen("Positionsnummern stehen auf der Karte", (await page.locator(".string-nummer").count()) === 4);
await tippe(3);
m = await page.evaluate(() => window.__pv.projekt().roofs[0].stringManuell);
pruefen("erneutes Antippen entfernt das Modul wieder", m.strings[0].module.join() === "0,1,2", m.strings[0].module.join());

await page.getByTestId("string-neu").click();
for (const i of [3, 4]) await tippe(i);
await tippe(2); // wandert vom ersten in den zweiten String
m = await page.evaluate(() => window.__pv.projekt().roofs[0].stringManuell);
pruefen("Modul eines anderen Strings wandert in den aktiven", m.strings[0].module.join() === "0,1" && m.strings[1].module.join() === "3,4,2", JSON.stringify(m.strings));

// gleiche MPPT-Eingänge, verschieden lange Strings → Warnung
await page.getByTestId("string-mppt").selectOption("1");
await page.getByTestId("string-waehlen-0").click();
await page.getByTestId("string-mppt").selectOption("1");
await page.getByTestId("details-umschalten").click();
await page.getByTestId("mppt-meldung").waitFor();
pruefen("verschieden lange Strings an einem MPPT werden gemeldet", (await text("mppt-meldung")).includes("MPPT 1"), await text("mppt-meldung"));
pruefen("nicht belegte Module werden gemeldet", await page.getByText(/Module? ohne String/).first().isVisible());

await page.getByTestId("hand-aus-D1").click();
const nach = await page.evaluate(() => window.__pv.projekt().roofs[0].stringManuell ?? null);
pruefen("zurück zu automatisch entfernt den Handplan", nach === null);
pruefen("keine Konsolenfehler", fehler.length === 0, fehler.join("; "));
await browser.close();
