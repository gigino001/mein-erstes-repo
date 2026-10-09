#!/usr/bin/env python3
"""Luftbildausschnitt eines LoD2-Gebäudes mit Koordinatengitter (zum Festlegen von Antippunkten).
Aufruf: python3 -I crop_grid.py LOD2_KACHEL.json GEBAEUDE_ID_ENDE AUSGABE_PNG"""
import json, subprocess, sys
from PIL import Image, ImageDraw
tile, bid, out = sys.argv[1:4]
RES, PAD = 0.1, 5.0
b = next(x for x in json.load(open(tile)) if x["id"].endswith(bid))
xs = [p[0] for r in b["roofs"] for p in r["ring"]]; ys = [p[1] for r in b["roofs"] for p in r["ring"]]
e0, e1, n0, n1 = min(xs) - PAD, max(xs) + PAD, min(ys) - PAD, max(ys) + PAD
w, h = round((e1 - e0) / RES), round((n1 - n0) / RES)
url = (f"https://www.wms.nrw.de/geobasis/wms_nw_dop?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=nw_dop_rgb&STYLES="
       f"&CRS=EPSG:25832&BBOX={e0},{n0},{e1},{n1}&WIDTH={w}&HEIGHT={h}&FORMAT=image/png")
raw = out.replace(".png", "_raw.png")
subprocess.run(["curl", "-sS", "-m", "60", "-o", raw, url], check=True)
json.dump({"bbox": [e0, n0, e1, n1], "size": [w, h]}, open(out.replace(".png", ".json"), "w"))
im = Image.open(raw).convert("RGB"); k = 3
big = im.resize((w * k, h * k), Image.LANCZOS)
d = ImageDraw.Draw(big)
for x in range(0, w, 20):
    d.line([(x * k, 0), (x * k, h * k)], fill=(255, 255, 0), width=1); d.text((x * k + 2, 2), str(x), fill=(255, 255, 0))
for y in range(0, h, 20):
    d.line([(0, y * k), (w * k, y * k)], fill=(0, 255, 255), width=1); d.text((2, y * k + 2), str(y), fill=(0, 255, 255))
big.save(out); print(out, w, h)
