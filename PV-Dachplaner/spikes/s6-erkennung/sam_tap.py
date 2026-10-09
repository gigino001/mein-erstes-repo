#!/usr/bin/env python3
"""S6-Prototyp: Antippen eines Hindernisses -> Maske (MobileSAM). Zum Vergleich mit der Handbewertung.
Aufruf: python3 -I sam_tap.py MODELLORDNER BILD_RAW.png AUSGABE.png "x,y" "x,y" ...   (Pixel im Bild, 0,1 m je Pixel)"""
import sys, time
import numpy as np, onnxruntime as ort
from PIL import Image, ImageDraw
models, raw, out = sys.argv[1:4]
taps = [tuple(int(v) for v in a.split(",")) for a in sys.argv[4:]]
RES = 0.1
enc = ort.InferenceSession(f"{models}/mobile_sam_image_encoder.onnx", providers=["CPUExecutionProvider"])
dec = ort.InferenceSession(f"{models}/sam_mask_decoder_multi.onnx", providers=["CPUExecutionProvider"])
img = Image.open(raw).convert("RGB"); w, h = img.size
sc = 1024 / max(w, h)
t0 = time.time()
emb = enc.run(None, {"input_image": np.asarray(img.resize((round(w * sc), round(h * sc)), Image.BILINEAR)).astype(np.float32)})[0]
print(f"Kodieren {time.time()-t0:.2f} s")
k = 4
ov = img.resize((w * k, h * k), Image.LANCZOS).convert("RGBA")
layer = Image.new("RGBA", ov.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
cols = [(255, 0, 0), (0, 255, 255), (255, 0, 255), (0, 255, 0), (255, 160, 0), (80, 120, 255), (255, 255, 0)]
for i, (x, y) in enumerate(taps):
    t0 = time.time()
    masks, iou, _ = dec.run(None, {"image_embeddings": emb,
        "point_coords": np.array([[[x * sc, y * sc], [0, 0]]], np.float32), "point_labels": np.array([[1, -1]], np.float32),
        "mask_input": np.zeros((1, 1, 256, 256), np.float32), "has_mask_input": np.zeros(1, np.float32),
        "orig_im_size": np.array([h, w], np.float32)})
    ms = [(float(iou[0, j]), masks[0, j] > 0) for j in range(4)]
    info = [(round(a, 2), round(float(m.sum()) * RES * RES, 2)) for a, m in ms]
    ok = [(a, m) for a, m in ms if m[y, x] and m.sum() * RES * RES <= 8.0]
    best = max(ok, key=lambda t: t[0]) if ok else None
    print(f"Tap {i+1} ({x},{y}) {(time.time()-t0)*1000:.0f} ms  Masken (iou, m²): {info} -> gewählt: {None if not best else (round(best[0],2), round(best[1].sum()*RES*RES,2))}")
    if best:
        m = best[1]
        arr = np.zeros((h, w, 4), np.uint8); arr[m] = (*cols[i % len(cols)], 120)
        layer = Image.alpha_composite(layer, Image.fromarray(arr, "RGBA").resize((w * k, h * k), Image.NEAREST))
        ld = ImageDraw.Draw(layer)
    ld.ellipse([x * k - 4, y * k - 4, x * k + 4, y * k + 4], outline=(255, 255, 255, 255)); ld.text((x * k + 6, y * k - 6), str(i + 1), fill=(255, 255, 255, 255))
Image.alpha_composite(ov, layer).convert("RGB").save(out)
