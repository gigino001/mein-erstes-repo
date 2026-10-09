#!/usr/bin/env python3
"""Liest eine NRW-LoD2-Kachel (CityGML 1.0) und extrahiert je Gebäude die Dachflächen.

Aufruf:  python3 -I parse_tile.py KACHEL.gml [--out gebaeude.json] [--punkt E N]

Je Dachfläche werden Neigung, Ausrichtung (Fallrichtung, Kompassgrad), Grundrissfläche und Schrägfläche
aus den 3D-Koordinaten über die Flächennormale (Newell-Verfahren) berechnet.
"""
import json
import math
import resource
import sys
import time

from lxml import etree

NS = {
    "core": "http://www.opengis.net/citygml/1.0",
    "bldg": "http://www.opengis.net/citygml/building/1.0",
    "gml": "http://www.opengis.net/gml",
    "gen": "http://www.opengis.net/citygml/generics/1.0",
}
B = "{%s}" % NS["bldg"]
G = "{%s}" % NS["gml"]
GEN = "{%s}" % NS["gen"]


def ring_points(poslist_text):
    v = [float(x) for x in poslist_text.split()]
    return [(v[i], v[i + 1], v[i + 2]) for i in range(0, len(v) - 2, 3)]


def newell(pts):
    """Flächennormale (nicht normiert, Länge = 2 * Fläche) eines Rings."""
    nx = ny = nz = 0.0
    n = len(pts)
    for i in range(n):
        x1, y1, z1 = pts[i]
        x2, y2, z2 = pts[(i + 1) % n]
        nx += (y1 - y2) * (z1 + z2)
        ny += (z1 - z2) * (x1 + x2)
        nz += (x1 - x2) * (y1 + y2)
    return nx, ny, nz


def plane_info(exterior, holes):
    nx, ny, nz = newell(exterior)
    # Löcher abziehen (gleiche Ebene): Fläche der Löcher
    area2 = math.sqrt(nx * nx + ny * ny + nz * nz)
    for h in holes:
        hx, hy, hz = newell(h)
        area2 -= math.sqrt(hx * hx + hy * hy + hz * hz)
    if area2 <= 1e-9:
        return None
    ln = math.sqrt(nx * nx + ny * ny + nz * nz)
    if nz < 0:  # Normale nach oben drehen
        nx, ny, nz = -nx, -ny, -nz
    slope = math.degrees(math.acos(min(1.0, nz / ln)))
    az = math.degrees(math.atan2(nx, ny)) % 360 if slope > 0.5 else None
    return {
        "slopeDeg": round(slope, 1),
        "azimuthDeg": None if az is None else round(az, 1),
        "areaM2": round(area2 / 2, 2),
        "planAreaM2": round(area2 / 2 * math.cos(math.radians(slope)), 2),
    }


def parse(path):
    t0 = time.time()
    buildings = []
    for _, el in etree.iterparse(path, events=("end",), tag=B + "Building"):
        b = {"id": el.get(G + "id")}
        rt = el.find(B + "roofType")
        b["roofType"] = rt.text if rt is not None else None
        mh = el.find(B + "measuredHeight")
        b["height"] = float(mh.text) if mh is not None else None
        for a in el.findall(GEN + "stringAttribute"):
            if a.get("name") == "Grundrissaktualitaet":
                b["footprintDate"] = a.find(GEN + "value").text
        roofs = []
        for rs in el.iter(B + "RoofSurface"):
            for poly in rs.iter(G + "Polygon"):
                ext = poly.find(G + "exterior//" + G + "posList")
                if ext is None:
                    continue
                exterior = ring_points(ext.text)
                holes = [ring_points(p.text) for p in poly.findall(G + "interior//" + G + "posList")]
                info = plane_info(exterior, holes)
                if info:
                    info["ring"] = [(round(x, 2), round(y, 2), round(z, 2)) for x, y, z in exterior[:-1]]
                    roofs.append(info)
        b["roofs"] = roofs
        gs = el.findall(".//" + B + "GroundSurface//" + G + "posList")
        if gs:
            pts = ring_points(gs[0].text)
            b["footprint"] = [(round(x, 2), round(y, 2)) for x, y, _ in pts[:-1]]
        buildings.append(b)
        el.clear()
        while el.getprevious() is not None:
            del el.getparent()[0]
    return buildings, time.time() - t0


def compact(buildings, tile):
    """Kompaktes Austauschformat je 1-km-Kachel: Koordinaten relativ zur Südwestecke der Kachel (Meter)."""
    e0, n0 = tile
    out = []
    for b in buildings:
        if not b["roofs"]:
            continue
        out.append({
            "i": b["id"][-8:],
            "t": b["roofType"],
            "h": b["height"],
            "r": [[r["slopeDeg"], r["azimuthDeg"], r["areaM2"],
                   [[round(p[0] - e0, 2), round(p[1] - n0, 2), round(p[2], 1)] for p in r["ring"]]] for r in b["roofs"]],
        })
    return {"tile": [e0, n0], "format": 1, "buildings": out}


def main():
    path = sys.argv[1]
    out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else None
    buildings, secs = parse(path)
    n_roofs = sum(len(b["roofs"]) for b in buildings)
    rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024
    types = {}
    for b in buildings:
        types[b["roofType"]] = types.get(b["roofType"], 0) + 1
    print(f"{path}: {len(buildings)} Gebäude, {n_roofs} Dachflächen, {secs:.1f} s, max. Speicher {rss:.0f} MB")
    print("Dachformen (ADV-Code):", dict(sorted(types.items(), key=lambda kv: -kv[1])))
    if out:
        json.dump(buildings, open(out, "w"))
        print("geschrieben:", out)
    if "--compact" in sys.argv:
        import gzip, re
        m = re.search(r"LoD2_32_(\d+)_(\d+)_1_NW", path)
        tile = (int(m[1]) * 1000, int(m[2]) * 1000)
        data = json.dumps(compact(buildings, tile), separators=(",", ":")).encode()
        target = sys.argv[sys.argv.index("--compact") + 1]
        with open(target, "wb") as f:
            f.write(gzip.compress(data, 6))
        print(f"kompakt: {len(data)/1e6:.2f} MB, gzip {len(gzip.compress(data, 6))/1e6:.2f} MB -> {target}")


if __name__ == "__main__":
    main()
