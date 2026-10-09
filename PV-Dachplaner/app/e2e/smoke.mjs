// Rauchtest: lädt die gebaute App (npm run preview) in Chromium und prüft das Rechenbeispiel.
import { chromium } from "playwright";
const base = process.env.BASE ?? "http://127.0.0.1:4173";
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", ...(process.env.HTTPS_PROXY && !base.startsWith("http://127") ? [`--proxy-server=${process.env.HTTPS_PROXY}`] : [])],
});
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(base + "/");
const flaeche = await page.getByTestId("flaeche").textContent();
const module = await page.getByTestId("module").textContent();
const kwp = await page.getByTestId("kwp").textContent();
const ok = /61,04/.test(flaeche) && /24 Module/.test(module) && /11,04/.test(kwp) && errors.length === 0;
console.log(JSON.stringify({ flaeche, module, kwp, errors, ok }));
await browser.close();
process.exit(ok ? 0 : 1);
