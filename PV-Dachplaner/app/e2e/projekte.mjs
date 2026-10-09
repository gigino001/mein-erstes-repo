// Ende-zu-Ende: Projekt anlegen, öffnen, duplizieren, löschen, sichern und wieder einlesen; Neuladen behält die Daten.
import fs from "node:fs";
import { base, karteBereit, pruefen, starten } from "./helfer.mjs";

const { browser, page, fehler } = await starten();
await page.goto(base + "/");
pruefen("leere Liste beim ersten Start", await page.getByTestId("leer").isVisible());

await page.getByTestId("neu").click();
await karteBereit(page);
await page.getByTestId("name").fill("Familie Test");
await page.getByTestId("anlegen").click();
await page.getByTestId("projektname").waitFor();
pruefen("Editor zeigt den Projektnamen", (await page.getByTestId("projektname").textContent()) === "Familie Test");
await karteBereit(page);
await page.getByText(/Luftbild vom \d{2}\.\d{2}\.\d{4}/).waitFor({ timeout: 20000 });
pruefen("Befliegungsdatum im Projekt gespeichert und angezeigt", true);

await page.getByLabel("Zur Projektliste").click();
await page.getByTestId("projekte").waitFor();
pruefen("Projekt steht in der Liste", (await page.getByTestId("projekte").textContent()).includes("Familie Test"));
pruefen("Hinweis 'noch keine Dachfläche'", (await page.getByTestId("projekte").textContent()).includes("noch keine Dachfläche"));

await page.reload();
await page.getByTestId("projekte").waitFor();
pruefen("Projekt überlebt Neuladen", (await page.getByTestId("projekte").textContent()).includes("Familie Test"));

await page.getByLabel("Mehr zu Familie Test").click();
await page.getByRole("menuitem", { name: "Duplizieren" }).click();
await page.waitForFunction(() => document.querySelectorAll('[data-testid="projekte"] li').length === 2);
pruefen("Duplizieren ergibt zwei Projekte", true);

const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Sicherung exportieren" }).click()]);
const pfad = "/tmp/pv-sicherung-test.json";
await dl.saveAs(pfad);
const sicherung = JSON.parse(fs.readFileSync(pfad, "utf8"));
pruefen("Sicherung enthält beide Projekte", sicherung.format === "pv-dachplaner" && sicherung.projekte.length === 2);

page.once("dialog", (d) => d.accept());
await page.getByLabel("Mehr zu Familie Test (Kopie)").click();
await page.getByRole("menuitem", { name: "Löschen" }).click();
await page.waitForFunction(() => document.querySelectorAll('[data-testid="projekte"] li').length === 1);
pruefen("Löschen entfernt das Projekt", true);

await page.locator('input[type=file]').setInputFiles(pfad);
await page.getByTestId("meldung").waitFor();
const meldung = await page.getByTestId("meldung").textContent();
pruefen("Einlesen stellt die Kopie wieder her", /1 neu/.test(meldung) && /1 übersprungen/.test(meldung), meldung);

pruefen("keine Konsolenfehler", fehler.length === 0, fehler.join(" | "));
await browser.close();
