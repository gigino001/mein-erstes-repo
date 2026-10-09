#!/usr/bin/env python3
"""Baut aus den NRW-Gebäudereferenzen (Hauskoordinaten) einen kompakten Adressindex je Gemeinde.

Aufruf:  python3 -I build_index.py gebref.txt AUSGABEORDNER [Regierungsbezirk]
Spalten der Eingabe (Semikolon): 0 Status, 1 Kennung, 2 Typ, 3 Landschl, 4 Land, 5 Regbezschl, 6 Regbez,
7 Kreisschl, 8 Kreis, 9 Gmdschl, 10 Gmd, 11 Gmdteilschl?, 12 Teil, 13 Strassenschl, 14 Strasse, 15 Hausnr,
16 Zusatz, 17 Zone, 18 Ost, 19 Nord, 20 Datum
"""
import gzip
import json
import os
import sys
import unicodedata
from collections import defaultdict


def main():
    src, outdir = sys.argv[1], sys.argv[2]
    only = sys.argv[3] if len(sys.argv) > 3 else None
    os.makedirs(outdir, exist_ok=True)
    groups = defaultdict(lambda: defaultdict(list))
    meta = {}
    n = 0
    with open(src, encoding="utf-8") as f:
        for line in f:
            p = line.rstrip("\n").split(";")
            if only and p[6] != only:
                continue
            key = p[7] + "_" + p[9]
            meta[key] = {"kreis": p[8], "gmd": p[10]}
            groups[key][p[14]].append([p[15], p[16], round(float(p[18]), 1), round(float(p[19]), 1)])
            n += 1
    total_raw = total_gz = 0
    index = []
    for key, streets in sorted(groups.items()):
        # Koordinaten relativ zum Südwestpunkt der Gemeinde, in Dezimetern (ganzzahlig)
        e0 = min(a[2] for v in streets.values() for a in v)
        n0 = min(a[3] for v in streets.values() for a in v)
        out = {"e0": e0, "n0": n0, "s": {}}
        for street, adr in sorted(streets.items()):
            out["s"][street] = [[a[0], a[1], round((a[2] - e0) * 10), round((a[3] - n0) * 10)] for a in adr]
        raw = json.dumps(out, separators=(",", ":"), ensure_ascii=False).encode()
        gz = gzip.compress(raw, 9)
        with open(os.path.join(outdir, key + ".json.gz"), "wb") as w:
            w.write(gz)
        total_raw += len(raw)
        total_gz += len(gz)
        index.append({"key": key, **meta[key], "strassen": len(streets), "adressen": sum(len(v) for v in streets.values()), "gz": len(gz)})
    json.dump(index, open(os.path.join(outdir, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"{n} Adressen, {len(groups)} Gemeinden, roh {total_raw/1e6:.1f} MB, gzip {total_gz/1e6:.1f} MB")
    big = sorted(index, key=lambda x: -x["gz"])[:3]
    print("größte Gemeindedateien:", [(b["gmd"], round(b["gz"] / 1e3)) for b in big], "kB gzip")


if __name__ == "__main__":
    main()
