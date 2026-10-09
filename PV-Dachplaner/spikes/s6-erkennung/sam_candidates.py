#!/usr/bin/env python3
"""S6-Prototyp: Hindernis-Kandidaten auf einem Dach mit MobileSAM (ohne Training).

Ablauf: Luftbildausschnitt (0,1 m/Pixel) -> Bild einmal kodieren -> Gitter von Antippunkten im Dachumriss
-> je Punkt eine Maske -> Masken filtern (Größe, liegt im Dach, nicht das ganze Dach) -> Doppelte entfernen.

Aufruf: python3 -I sam_candidates.py MODELLORDNER LOD2_KACHEL.json GEBAEUDE_ID_ENDE AUSGABE.png [Rasterweite_m]
"""
import json
import subprocess
import sys
import time

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw

MODELS, TILE_JSON, BID, OUT = sys.argv[1:5]
GRID_M = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
RES = 0.1  # Meter je Pixel
PAD_M = 6.0

enc = ort.InferenceSession(f"{MODELS}/mobile_sam_image_encoder.onnx", providers=["CPUExecutionProvider"])
dec = ort.InferenceSession(f"{MODELS}/sam_mask_decoder_multi.onnx", providers=["CPUExecutionProvider"])

tile = json.load(open(TILE_JSON))
b = next(x for x in tile if x["id"].endswith(BID))
rings = [[(p[0], p[1]) for p in r["ring"]] for r in b["roofs"]]
xs = [p[0] for r in rings for p in r]
ys = [p[1] for r in rings for p in r]
e0, e1, n0, n1 = min(xs) - PAD_M, max(xs) + PAD_M, min(ys) - PAD_M, max(ys) + PAD_M
w = int(round((e1 - e0) / RES))
h = int(round((n1 - n0) / RES))
url = (f"https://www.wms.nrw.de/geobasis/wms_nw_dop?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=nw_dop_rgb&STYLES="
       f"&CRS=EPSG:25832&BBOX={e0},{n0},{e1},{n1}&WIDTH={w}&HEIGHT={h}&FORMAT=image/png")
subprocess.run(["curl", "-sS", "-m", "60", "-o", "/tmp/crop.png", url], check=True)
img = Image.open("/tmp/crop.png").convert("RGB")
arr = np.asarray(img).astype(np.float32)
print(f"Ausschnitt {w}x{h} px = {w*RES:.0f} x {h*RES:.0f} m, Dachflächen {len(rings)}")


def px(e, n):
    return (e - e0) / RES, (e1 * 0 + n1 - n) / RES


roof_mask_img = Image.new("L", (w, h), 0)
d = ImageDraw.Draw(roof_mask_img)
for r in rings:
    d.polygon([px(*p) for p in r], fill=255)
roof = np.asarray(roof_mask_img) > 0

t0 = time.time()
# Wichtig: Der Encoder erwartet das Bild bereits auf 1024 Pixel (längste Seite) vergrößert, Werte 0..255
# (Normalisierung steckt im Modell). Mit dem kleinen Originalbild liefert er unbrauchbare Einbettungen.
scale = 1024.0 / max(h, w)
big = np.asarray(img.resize((round(w * scale), round(h * scale)), Image.BILINEAR)).astype(np.float32)
emb = enc.run(None, {"input_image": big})[0]
t_enc = time.time() - t0
print(f"Bild kodieren: {t_enc:.2f} s")

# Antippunkte: Auffälligkeiten im Dach (Farbabweichung vom Median der jeweiligen Dachfläche), statt starrem Gitter.
# Ein enges Gitter (0,3 m) würde rund 1500 Masken je Dach erzeugen; Auffälligkeiten liefern meist unter 40 Punkte.
MODE = sys.argv[6] if len(sys.argv) > 6 else "anomaly"
DEV = float(sys.argv[7]) if len(sys.argv) > 7 else 28.0


def components(mask):
    hh, ww = mask.shape
    seen = np.zeros_like(mask, bool)
    out = []
    for y0 in range(hh):
        for x0 in range(ww):
            if mask[y0, x0] and not seen[y0, x0]:
                stack = [(y0, x0)]
                seen[y0, x0] = True
                pts_ = []
                while stack:
                    y_, x_ = stack.pop()
                    pts_.append((y_, x_))
                    for dy_, dx_ in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny_, nx_ = y_ + dy_, x_ + dx_
                        if 0 <= ny_ < hh and 0 <= nx_ < ww and mask[ny_, nx_] and not seen[ny_, nx_]:
                            seen[ny_, nx_] = True
                            stack.append((ny_, nx_))
                out.append(pts_)
    return out


def inner(mask_img, border_px=3):
    """Dachmaske um einen Rand verkleinert (Kanten und Traufschatten nicht als Auffälligkeit werten)."""
    m = np.asarray(mask_img) > 0
    out = m.copy()
    for dy_ in range(-border_px, border_px + 1):
        for dx_ in range(-border_px, border_px + 1):
            out &= np.roll(np.roll(m, dy_, 0), dx_, 1)
    return out


if MODE == "grid":
    step = int(round(GRID_M / RES))
    pts = [(x, y) for y in range(step // 2, h, step) for x in range(step // 2, w, step) if roof[y, x]]
else:
    pts = []
    for r in rings:
        pm = Image.new("L", (w, h), 0)
        ImageDraw.Draw(pm).polygon([px(*p) for p in r], fill=255)
        core = inner(pm)
        if core.sum() < 50:
            continue
        med = np.median(arr[core], axis=0)
        dev = np.abs(arr - med).max(axis=2)
        anomalies = core & (dev > DEV)
        for comp in components(anomalies):
            if len(comp) < 6:  # unter 0,06 m²
                continue
            ys_ = np.array([c[0] for c in comp])
            xs_ = np.array([c[1] for c in comp])
            cy_, cx_ = int(ys_.mean()), int(xs_.mean())
            if not anomalies[cy_, cx_]:
                cy_, cx_ = comp[len(comp) // 2]
            pts.append((cx_, cy_))
print(f"Antippunkte ({MODE}): {len(pts)}")
cands = []
t0 = time.time()
for (x, y) in pts:
    coords = np.array([[[x * scale, y * scale], [0.0, 0.0]]], dtype=np.float32)
    labels = np.array([[1.0, -1.0]], dtype=np.float32)
    masks, iou, _ = dec.run(None, {
        "image_embeddings": emb, "point_coords": coords, "point_labels": labels,
        "mask_input": np.zeros((1, 1, 256, 256), np.float32), "has_mask_input": np.zeros(1, np.float32),
        "orig_im_size": np.array([h, w], np.float32)})
    m = masks[0, 0] > 0
    for k in range(masks.shape[1]):  # vier Masken je Punkt: Teil, Teil, Ganzes, ...
        cands.append((float(iou[0, k]), masks[0, k] > 0, (x, y)))
t_dec = time.time() - t0
print(f"{len(pts)} Antippunkte, Masken berechnen: {t_dec:.2f} s ({t_dec/max(1,len(pts))*1000:.0f} ms je Antippunkt, je 4 Masken)")

# Statistik
if True:
    ar=np.array([m.sum()*RES*RES for _,m,_ in cands]); io=np.array([i for i,_,_ in cands])
    print("Masken: iou Median %.2f, Fläche m² P10/P50/P90: %.2f/%.2f/%.1f"%(np.median(io),*np.percentile(ar,[10,50,90])))
    print("  iou>=0.8:",int((io>=0.8).sum()),"  Fläche 0.08-4 m²:",int(((ar>=0.08)&(ar<=4)).sum()))
if len(sys.argv) > 8:
    for iou_, m_, p_ in cands:
        print("  Punkt", p_, "iou %.2f"%iou_, "Fläche %.2f m²"%(m_.sum()*RES*RES), "im Dach %.0f %%"%(100*(m_&roof).sum()/max(1,m_.sum())), "enthält Punkt:", bool(m_[p_[1], p_[0]]))
# Filter
kept = []
roof_area = roof.sum() * RES * RES
for iou, m, p in cands:
    area = m.sum() * RES * RES
    if iou < 0.80 or not (0.08 <= area <= 4.0):
        continue
    inside = (m & roof).sum() / max(1, m.sum())
    if inside < 0.8:
        continue
    kept.append((iou, m, p, area))
kept.sort(key=lambda t: -t[0])
final = []
for iou, m, p, area in kept:
    if any(((m & f[1]).sum() / max(1, (m | f[1]).sum())) > 0.5 for f in final):
        continue
    final.append((iou, m, p, area))
print(f"Kandidaten nach Filter: {len(final)} (vor Entdoppelung {len(kept)}); Dachfläche in Draufsicht {roof_area:.0f} m²")

# Überlagerung
ov = img.copy()
dr = ImageDraw.Draw(ov, "RGBA")
for r in rings:
    dr.line([px(*p) for p in r + [r[0]]], fill=(255, 255, 0, 255), width=1)
colors = [(255, 0, 0), (0, 255, 255), (255, 0, 255), (0, 255, 0), (255, 128, 0), (0, 128, 255)]
layer = np.zeros((h, w, 4), np.uint8)
for i, (iou, m, p, area) in enumerate(final):
    c = colors[i % len(colors)]
    layer[m] = (*c, 110)
ov = Image.alpha_composite(ov.convert("RGBA"), Image.fromarray(layer, "RGBA"))
dr = ImageDraw.Draw(ov)
for i, (iou, m, p, area) in enumerate(final):
    yy, xx = np.nonzero(m)
    dr.text((xx.min(), yy.min() - 10), f"{i+1}", fill=(255, 255, 255, 255))
scale_up = max(1, 900 // max(w, h))
ov.convert("RGB").resize((w * scale_up, h * scale_up), Image.NEAREST).save(OUT)
img.resize((w * scale_up, h * scale_up), Image.LANCZOS).save(OUT.replace(".png", "_orig.png"))
json.dump([{"nr": i + 1, "iou": round(iou, 3), "areaM2": round(area, 2), "px": [int(p[0]), int(p[1])]} for i, (iou, m, p, area) in enumerate(final)],
          open(OUT.replace(".png", ".json"), "w"))
print("Kandidaten:", [(i + 1, round(a, 2), round(iou, 2)) for i, (iou, m, p, a) in enumerate(final)][:20])
