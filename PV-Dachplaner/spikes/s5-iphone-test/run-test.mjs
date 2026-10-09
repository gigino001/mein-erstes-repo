// Headless-Test: Modelle laden, Beispieldach öffnen, Objekte antippen; gibt den Bericht der Seite aus.
import { chromium } from "playwright";
const base = process.env.BASE ?? "http://127.0.0.1:8766";
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", ...(process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`, "--proxy-bypass-list=127.0.0.1;localhost"] : [])],
});
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("console error:", m.text().slice(0, 200)); });
await page.goto(base + "/");
await page.click("#load");
await page.waitForFunction(() => window.__ready === true || window.__report.errors.length > 0, null, { timeout: 170000 });
let rep = await page.evaluate(() => window.__report);
if (rep.errors.length) { console.log(JSON.stringify(rep, null, 1)); await browser.close(); process.exit(1); }
await page.evaluate(() => window.loadImage("dach2"));
const taps = [[130, 101], [115, 70], [205, 172], [131, 114]];
for (const [x, y] of taps) await page.evaluate(([x, y]) => window.tapAt(x, y), [x, y]);
await page.screenshot({ path: "shot.png" });
rep = await page.evaluate(() => window.__report);
console.log(JSON.stringify({ threads: rep.threads, isolated: rep.crossOriginIsolated, download_ms: [rep.encoderDownloadMs, rep.decoderDownloadMs], bytes_MB: +((rep.encoderBytes + rep.decoderBytes) / 1e6).toFixed(1), sessionCreate_ms: rep.sessionCreateMs, errors: rep.errors,
  taps: rep.taps.map((t) => ({ tap: t.tap, encode_ms: t.encodeMs, decode_ms: t.decodeMs, chosen: t.chosen })) }));
await browser.close();
