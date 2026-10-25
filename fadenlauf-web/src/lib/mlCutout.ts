// KI-Freistellen im Browser mit RMBG-1.4 (Bria, nicht-kommerzielle Lizenz) über transformers.js.
// Das Modell (quantisiert, ca. 44 MB) wird beim ersten Gebrauch geladen und vom Browser zwischengespeichert.
// Alles läuft auf dem Gerät: die Fotos werden dafür nirgendwohin gesendet.

const MODEL = "briaai/RMBG-1.4";
export const MODEL_MB = 44;

type Lib = typeof import("@huggingface/transformers");
let loading: Promise<{ lib: Lib; model: any; processor: any }> | null = null;
let ready = false;
export const mlReady = () => ready;

const MODE_KEY = "fadenlauf-cutmode";
export type CutMode = "ml" | "fast";
export const getCutMode = (): CutMode => { try { return localStorage.getItem(MODE_KEY) === "fast" ? "fast" : "ml"; } catch { return "ml"; } };
export const setCutMode = (m: CutMode) => { try { localStorage.setItem(MODE_KEY, m); } catch { /* privat */ } };

/** Lädt Bibliothek und Modell einmalig. Schlägt es fehl, wird beim nächsten Mal neu versucht. */
export function loadMl(onProgress?: (percent: number) => void) {
  if (!loading) {
    loading = (async () => {
      const lib = await import("@huggingface/transformers");
      lib.env.allowLocalModels = false;
      const seen: Record<string, { loaded: number; total: number }> = {};
      const progress_callback = (p: any) => {
        if (p.status === "progress" && p.file?.endsWith(".onnx")) { seen[p.file] = { loaded: p.loaded, total: p.total }; const t = Object.values(seen).reduce((a, b) => a + b.total, 0) || 1; onProgress?.(Math.round((Object.values(seen).reduce((a, b) => a + b.loaded, 0) / t) * 100)); }
      };
      const model = await lib.AutoModel.from_pretrained(MODEL, { config: { model_type: "custom" } as any, dtype: "q8", progress_callback });
      const processor = await lib.AutoProcessor.from_pretrained(MODEL, {
        config: { do_normalize: true, do_pad: false, do_rescale: true, do_resize: true, image_mean: [0.5, 0.5, 0.5], feature_extractor_type: "ImageFeatureExtractor", image_std: [1, 1, 1], resample: 2, rescale_factor: 0.00392156862745098, size: { width: 1024, height: 1024 } } as any,
      });
      ready = true;
      return { lib, model, processor };
    })().catch((e) => { loading = null; throw e; });
  }
  return loading;
}

/** Aus Alpha-Maske (0–255 je Pixel) Quelle und Zuschnitt prüfen: bbox, Anteil, Zusammenhang. */
export function maskStats(alpha: Uint8Array | Uint8ClampedArray, w: number, h: number) {
  let cnt = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let i = 0; i < alpha.length; i++) if (alpha[i] > 128) { cnt++; const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const frac = cnt / (w * h), solidity = cnt / Math.max(1, (x1 - x0 + 1) * (y1 - y0 + 1));
  return { cnt, frac, solidity, box: [x0, y0, x1, y1] as [number, number, number, number] };
}
/** Maske nur annehmen, wenn sie wie ein Kleidungsstück aussieht (nicht leer, nicht das ganze Bild, nicht zerfetzt). */
export const maskLooksOk = (s: { frac: number; solidity: number }) => s.frac >= 0.03 && s.frac <= 0.97 && s.solidity >= 0.2;

/** Weiche Kante: Werte unterhalb der Schwelle verschwinden, darüber sind sie deckend. tol: 0.6 (fein) bis 1.8 (grob). */
export function applyThreshold(m: Uint8Array | Uint8ClampedArray, tol: number) {
  const mid = Math.min(0.85, Math.max(0.2, 0.5 * tol)) * 255, soft = 28;
  const out = new Uint8ClampedArray(m.length);
  for (let i = 0; i < m.length; i++) out[i] = Math.max(0, Math.min(255, ((m[i] - (mid - soft)) / (2 * soft)) * 255));
  return out;
}

export async function mlCutoutBlob(src: Blob, tol = 1, onProgress?: (p: number) => void): Promise<Blob | null> {
  const { lib, model, processor } = await loadMl(onProgress);
  const url = URL.createObjectURL(src);
  try {
    const im = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("image")); i.src = url; });
    const s = Math.min(1, 1000 / Math.max(im.naturalWidth, im.naturalHeight)); const W = Math.max(16, Math.round(im.naturalWidth * s)), H = Math.max(16, Math.round(im.naturalHeight * s));
    const c = document.createElement("canvas"); c.width = W; c.height = H; const cx = c.getContext("2d", { willReadFrequently: true })!; cx.fillStyle = "#fff"; cx.fillRect(0, 0, W, H); cx.drawImage(im, 0, 0, W, H);
    const px = cx.getImageData(0, 0, W, H);
    const raw = new lib.RawImage(new Uint8ClampedArray(px.data), W, H, 4).rgb();
    const { pixel_values } = await processor(raw);
    const { output } = await model({ input: pixel_values });
    const mask = await lib.RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(W, H);
    const alpha = applyThreshold(mask.data as Uint8Array, tol);
    const st = maskStats(alpha, W, H);
    if (!maskLooksOk(st)) return null;
    for (let i = 0; i < alpha.length; i++) px.data[i * 4 + 3] = alpha[i];
    cx.putImageData(px, 0, 0);
    const pad = Math.round(0.03 * Math.max(W, H)); const [x0, y0, x1, y1] = st.box;
    const ax = Math.max(0, x0 - pad), ay = Math.max(0, y0 - pad), bx = Math.min(W, x1 + 1 + pad), by = Math.min(H, y1 + 1 + pad);
    const oc = document.createElement("canvas"); oc.width = bx - ax; oc.height = by - ay; oc.getContext("2d")!.drawImage(c, ax, ay, oc.width, oc.height, 0, 0, oc.width, oc.height);
    return await new Promise<Blob | null>((res) => oc.toBlob(res, "image/webp", 0.9));
  } finally { URL.revokeObjectURL(url); }
}
