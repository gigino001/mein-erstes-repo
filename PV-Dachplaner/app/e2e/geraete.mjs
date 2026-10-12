// Ende-zu-Ende: Geräte-Eingabemaske (eigenes Modul und Wechselrichter anlegen, Vorschau, Speichern über Neuladen).
import { base, pruefen, starten } from "./helfer.mjs";

const { browser, page, fehler } = await starten();
await page.goto(base + "/#/");
await page.getByTestId("geraete-oeffnen").click();
await page.getByTestId("modul-liste").waitFor();
pruefen("Datenblatt-Module sind eingebaut", (await page.getByTestId("modul-liste").locator("li").count()) >= 2);
pruefen("Sungrow SH-T-Serie ist eingebaut", (await page.getByTestId("wr-liste").getByText("Sungrow SH10.0T", { exact: false }).count()) + (await page.getByTestId("wr-liste").getByText("Sungrow SH10T").count()) >= 1);

// Modul ohne Pflichtfeld wird abgelehnt
await page.getByTestId("modul-neu").click();
await page.getByTestId("g-name").fill("Testmodul 400 W");
await page.getByTestId("g-speichern").click();
pruefen("Pflichtfeld Pmax wird verlangt", (await page.getByTestId("geraete-fehler").textContent()).includes("Pmax"));
for (const [k, v] of [["pmaxW", "400"], ["vocV", "37,5"], ["vmppV", "31,2"], ["iscA", "13,6"], ["imppA", "12,8"], ["tkVocProzent", "-0,27"], ["tkPmaxProzent", "-0,30"]]) await page.getByTestId("g-" + k).fill(v);
await page.getByTestId("g-speichern").click();
await page.getByTestId("geraete-meldung").waitFor();
pruefen("eigenes Modul erscheint in der Liste", (await page.getByTestId("modul-liste").getByText("Testmodul 400 W").count()) === 1);

// Wechselrichter als Kopie eines eingebauten
await page.getByTestId("wr-liste").locator("li").first().getByRole("button", { name: "Kopieren" }).click();
await page.getByTestId("g-name").fill("Testwechselrichter");
await page.getByTestId("g-speichern").click();
await page.getByTestId("geraete-meldung").waitFor();
pruefen("Kopie eines Wechselrichters wird gespeichert", (await page.getByTestId("wr-liste").getByText("Testwechselrichter").count()) === 1);

// Vorschau der Stringlänge
await page.locator("select").nth(0).selectOption({ label: "Testmodul 400 W" });
await page.locator("select").nth(1).selectOption({ label: "Testwechselrichter" });
await page.getByText(/Module je String/).first().waitFor();
pruefen("Vorschau nennt einen Bereich", /\d+ bis \d+ Module je String/.test(await page.getByText(/Module je String/).first().textContent()));

// bleibt nach dem Neuladen erhalten
await page.reload();
await page.getByTestId("modul-liste").waitFor();
pruefen("eigene Geräte bleiben nach dem Neuladen", (await page.getByTestId("modul-liste").getByText("Testmodul 400 W").count()) === 1 && (await page.getByTestId("wr-liste").getByText("Testwechselrichter").count()) === 1);
pruefen("keine Konsolenfehler", fehler.length === 0, fehler.join("; "));
await browser.close();
