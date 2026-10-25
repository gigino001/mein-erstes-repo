// Freistellen ohne KI: findet den Hintergrund über die Bildecken, flutet ihn vom Rand aus und liefert eine Maske.
// Reine Pixel-Logik, deshalb in Node testbar. Die Canvas-Hülle steht unten (cutoutBlob).

function blur3(a: Float32Array, w: number, h: number) {
  const t = new Float32Array(a.length);
  for (let y = 0; y < h; y++) { const o = y * w; for (let x = 0; x < w; x++) { const l = x > 0 ? a[o + x - 1] : a[o + x], r = x < w - 1 ? a[o + x + 1] : a[o + x]; t[o + x] = (l + a[o + x] + r) / 3; } }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; a[i] = ((y > 0 ? t[i - w] : t[i]) + t[i] + (y < h - 1 ? t[i + w] : t[i])) / 3; }
}
function morph(m: Uint8Array, w: number, h: number, grow: boolean) {
  const o = m.slice();
  for (let i = 0; i < m.length; i++) {
    const x = i % w, y = (i / w) | 0; const v = m[i];
    const n = [x > 0 ? m[i - 1] : v, x < w - 1 ? m[i + 1] : v, y > 0 ? m[i - w] : v, y < h - 1 ? m[i + w] : v];
    if (grow) { if (!v && (n[0] || n[1] || n[2] || n[3])) o[i] = 1; } else if (v && (!n[0] || !n[1] || !n[2] || !n[3])) o[i] = 0;
  }
  return o;
}

export type MaskResult =
  | { ok: false; why: string; frac?: number; bfr?: number }
  | { ok: true; mask: Uint8Array; box: [number, number, number, number]; frac: number; bfr: number; tG: number };

export function computeMask(px: ArrayLike<number>, w: number, h: number, tol = 1): MaskResult {
  tol = tol || 1; const N = w * h;
  const Y = new Float32Array(N), Cb = new Float32Array(N), Cr = new Float32Array(N);
  for (let i = 0; i < N; i++) { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2]; Y[i] = .299 * r + .587 * g + .114 * b; Cb[i] = 128 - .168736 * r - .331264 * g + .5 * b; Cr[i] = 128 + .5 * r - .418688 * g - .081312 * b; }
  for (let k = 0; k < 2; k++) { blur3(Y, w, h); blur3(Cb, w, h); blur3(Cr, w, h); }
  const dist = (i: number, y: number, cb: number, cr: number) => { const a = (Y[i] - y) * .55, p = Cb[i] - cb, q = Cr[i] - cr; return Math.sqrt(a * a + p * p + q * q); };
  const cs = Math.max(3, Math.round(Math.min(w, h) * .07));
  const corners = ([[0, 0], [w - cs, 0], [0, h - cs], [w - cs, h - cs]] as const).map(([x0, y0]) => {
    const ids: number[] = []; for (let y = y0; y < y0 + cs; y++) for (let x = x0; x < x0 + cs; x++) ids.push(y * w + x);
    const s = [0, 0, 0]; ids.forEach((i) => { s[0] += Y[i]; s[1] += Cb[i]; s[2] += Cr[i]; });
    return { ids, m: s.map((v) => v / ids.length) };
  });
  const cd = (a: number[], b: number[]) => { const d0 = (a[0] - b[0]) * .55, d1 = a[1] - b[1], d2 = a[2] - b[2]; return Math.sqrt(d0 * d0 + d1 * d1 + d2 * d2); };
  const score = corners.map((c) => corners.reduce((s, o) => s + cd(c.m, o.m), 0));
  const sorted = score.slice().sort((a, b) => a - b);
  const good = corners.filter((_, k) => score[k] <= sorted[1] * 1.6 + 20);
  const seedPx: number[] = []; good.forEach((c) => c.ids.forEach((i) => seedPx.push(i)));
  const bk = new Map<number, number[]>();
  for (const i of seedPx) { const k = (((Y[i] | 0) >> 5) << 8) | (((Cb[i] | 0) >> 4) << 4) | ((Cr[i] | 0) >> 4); const e = bk.get(k) || [0, 0, 0, 0]; e[0]++; e[1] += Y[i]; e[2] += Cb[i]; e[3] += Cr[i]; bk.set(k, e); }
  const seeds: number[][] = [];
  for (const e of [...bk.values()].sort((a, b) => b[0] - a[0])) { if (seeds.length >= 8 || e[0] < .03 * seedPx.length) break; seeds.push([e[1] / e[0], e[2] / e[0], e[3] / e[0]]); }
  if (!seeds.length) return { ok: false, why: "seeds" };
  const near = (i: number) => { let m = 1e9; for (const z of seeds) { const v = dist(i, z[0], z[1], z[2]); if (v < m) m = v; } return m; };
  const sd = seedPx.map(near).sort((a, b) => a - b); const p90 = sd[Math.floor(sd.length * .9)] || 0;
  const tG = Math.min(60, Math.max(14, p90 * 2.2 + 6)) * tol, tL = Math.max(6, tG * .35);
  const border: number[] = []; for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x); for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1);
  const bg = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
  for (const i of border) if (!bg[i] && near(i) < tG) { bg[i] = 1; q[qt++] = i; }
  while (qh < qt) {
    const i = q[qh++]; const x = i % w, y = (i / w) | 0;
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
      if (j < 0 || bg[j]) continue; const n = near(j);
      if (n < tG || (n < tG * 2 && dist(j, Y[i], Cb[i], Cr[i]) < tL)) { bg[j] = 1; q[qt++] = j; }
    }
  }
  let fg: Uint8Array = new Uint8Array(N); for (let i = 0; i < N; i++) fg[i] = bg[i] ? 0 : 1;
  fg = morph(morph(fg, w, h, true), w, h, false);
  const lab = new Int32Array(N); const sizes = [0]; let L = 0;
  for (let i = 0; i < N; i++) {
    if (!fg[i] || lab[i]) continue; L++; let n = 0; qh = qt = 0; q[qt++] = i; lab[i] = L;
    while (qh < qt) { const k = q[qh++]; n++; const x = k % w, y = (k / w) | 0; for (const j of [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, y > 0 ? k - w : -1, y < h - 1 ? k + w : -1]) { if (j >= 0 && fg[j] && !lab[j]) { lab[j] = L; q[qt++] = j; } } }
    sizes.push(n);
  }
  const big = Math.max(0, ...sizes); const keep = sizes.map((n) => n >= Math.max(.12 * big, .003 * N));
  for (let i = 0; i < N; i++) if (fg[i] && !keep[lab[i]]) fg[i] = 0;
  const er = morph(fg, w, h, false);
  let cnt = 0, bf = 0, x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let i = 0; i < N; i++) if (er[i]) { cnt++; const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  for (const i of border) if (fg[i]) bf++;
  const frac = cnt / N, bfr = bf / border.length;
  // Qualitätsprüfung: ein Kleidungsstück füllt das Foto spürbar und ist eine zusammenhängende Fläche.
  // Zerfetzte oder winzige Masken (Teil und Hintergrund fast gleichfarbig) lieber verwerfen als Müll liefern.
  const bboxArea = (x1 - x0 + 1) * (y1 - y0 + 1), solidity = cnt / Math.max(1, bboxArea);
  if (frac < .02) return { ok: false, why: "leer", frac, bfr };
  if (frac < .05) return { ok: false, why: "zu klein", frac, bfr };
  if (solidity < .3) return { ok: false, why: "zerfetzt", frac, bfr };
  if (frac > .95) return { ok: false, why: "voll", frac, bfr };
  if (bfr > .8) return { ok: false, why: "rand", frac, bfr };
  return { ok: true, mask: er, box: [x0, y0, x1, y1], frac, bfr, tG };
}

/** Browser-Hülle: Bild verkleinern, Maske berechnen, Original ausmaskieren und zuschneiden. Liefert WebP/PNG mit Alpha. */
export async function cutoutBlob(src: Blob, tol = 1): Promise<Blob | null> {
  const url = URL.createObjectURL(src);
  try {
    const im = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("image")); i.src = url; });
    const W0 = im.naturalWidth, H0 = im.naturalHeight;
    const s = Math.min(1, 420 / Math.max(W0, H0)); const w = Math.max(16, Math.round(W0 * s)), h = Math.max(16, Math.round(H0 * s));
    const c = document.createElement("canvas"); c.width = w; c.height = h; const cx = c.getContext("2d", { willReadFrequently: true })!; cx.drawImage(im, 0, 0, w, h);
    const r = computeMask(cx.getImageData(0, 0, w, h).data, w, h, tol); if (!r.ok) return null;
    const [x0, y0, x1, y1] = r.box; const N = w * h;
    const mc = document.createElement("canvas"); mc.width = w; mc.height = h; const mx = mc.getContext("2d")!; const md = mx.createImageData(w, h);
    for (let i = 0; i < N; i++) { md.data[i * 4] = md.data[i * 4 + 1] = md.data[i * 4 + 2] = 255; md.data[i * 4 + 3] = r.mask[i] ? 255 : 0; }
    mx.putImageData(md, 0, 0);
    const so = Math.min(1, 1000 / Math.max(W0, H0)); const W = Math.round(W0 * so), H = Math.round(H0 * so);
    const fc = document.createElement("canvas"); fc.width = W; fc.height = H; const fx = fc.getContext("2d")!; fx.drawImage(im, 0, 0, W, H);
    fx.globalCompositeOperation = "destination-in"; fx.imageSmoothingEnabled = true; fx.imageSmoothingQuality = "high"; fx.drawImage(mc, 0, 0, W, H);
    const k = W / w, pad = Math.round(.03 * Math.max(W, H));
    const cx0 = Math.max(0, Math.floor(x0 * k) - pad), cy0 = Math.max(0, Math.floor(y0 * k) - pad), cx1 = Math.min(W, Math.ceil((x1 + 1) * k) + pad), cy1 = Math.min(H, Math.ceil((y1 + 1) * k) + pad);
    const oc = document.createElement("canvas"); oc.width = cx1 - cx0; oc.height = cy1 - cy0; oc.getContext("2d")!.drawImage(fc, cx0, cy0, oc.width, oc.height, 0, 0, oc.width, oc.height);
    // WebP mit Alpha ist deutlich kleiner als PNG; Safari fällt von selbst auf PNG zurück.
    return await new Promise<Blob | null>((res) => oc.toBlob(res, "image/webp", 0.9));
  } finally { URL.revokeObjectURL(url); }
}

/** Foto verkleinern und als JPEG auf weißem Grund liefern. */
export function prepImage(file: Blob, max = 1400, q = 0.86): Promise<Blob> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)); const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
      const x = c.getContext("2d")!; x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? res(b) : rej(new Error("image_rejected"))), "image/jpeg", q);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("image_rejected")); };
    img.src = url;
  });
}
