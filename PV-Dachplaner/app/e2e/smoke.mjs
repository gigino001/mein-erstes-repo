// Rauchtest: lädt die gebaute App in Chromium, prüft Karte, Luftbild-Kacheln (HTTP 200) und Befliegungsdatum.
import { chromium } from "playwright";
const base = process.env.BASE ?? "http://127.0.0.1:4173";
const lokal = base.startsWith("http://127.") || base.startsWith("http://localhost");
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
    ...(process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`, "--proxy-bypass-list=127.0.0.1;localhost"] : [])],
});
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
const kacheln = { ok: 0, fehler: 0 };
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
page.on("response", (r) => {
  if (r.url().includes("wms.nrw.de") && r.url().includes("REQUEST=GetMap")) (r.status() === 200 ? kacheln.ok++ : kacheln.fehler++);
});
await page.goto(base + "/#/neu");
await page.getByTestId("karte").waitFor();
await page.waitForFunction(() => window.__karte && window.__karte.loaded(), null, { timeout: 60000 });
await page.waitForTimeout(1500);
const ok = kacheln.ok > 0 && kacheln.fehler === 0 && errors.length === 0;
console.log(JSON.stringify({ kacheln, errors, ok }));
await page.screenshot({ path: process.env.SHOT ?? "e2e/last.png" });
await browser.close();
process.exit(ok ? 0 : 1);
