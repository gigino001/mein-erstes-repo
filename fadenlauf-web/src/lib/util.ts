export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const clamp5 = (n: unknown) => clamp(Math.round(Number(n) || 3), 1, 5);
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
/** Komma-Text oder Array → saubere String-Liste. */
export const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean) : v ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : [];
export const isHex = (s: unknown): s is string => typeof s === "string" && /^#[0-9a-f]{3,8}$/i.test(s);
export const dayStart = (now = Date.now()) => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const eur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: n < 100 ? 2 : 0 });
export const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
export const sig = (ids: string[]) => [...ids].sort().join("|");
export const shortCat = (c: string) => String(c || "Teil").split(" &")[0];
