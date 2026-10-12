#!/usr/bin/env python3
"""Baut den Adressindex der App aus den NRW-Gebäudereferenzen (Hauskoordinaten).

Aufruf:  python3 -I build_adressen.py gebref.txt AUSGABEORDNER [Regierungsbezirk]

Quelle: https://www.opengeodata.nrw.de/produkte/geobasis/lk/akt/gebref_txt/gebref_EPSG25832_ASCII.zip (Geobasis NRW)
Ausgabe: index.json (Gemeinden mit Kennzahlen) und je Gemeinde `<kreis>_<gemeinde>.json`.
Koordinaten je Datei relativ zum Südwestpunkt (e0, n0) in Dezimetern; Straßen alphabetisch.

Spalten der Eingabe (Semikolon): 0 Status, 1 Kennung, 2 Typ, 3 Landschl, 4 Land, 5 Regbezschl, 6 Regbez,
7 Kreisschl, 8 Kreis, 9 Gmdschl, 10 Gmd, 11 Gmdteilschl, 12 Teil, 13 Strassenschl, 14 Strasse, 15 Hausnr,
16 Zusatz, 17 Zone, 18 Ost, 19 Nord, 20 Datum
"""
import json
import os
import sys
from collections import defaultdict


def main():
    src, outdir = sys.argv[1], sys.argv[2]
    nur = sys.argv[3] if len(sys.argv) > 3 else None
    os.makedirs(outdir, exist_ok=True)
    gruppen = defaultdict(lambda: defaultdict(list))
    meta = {}
    stand = ""
    n = 0
    with open(src, encoding="utf-8") as f:
        for zeile in f:
            p = zeile.rstrip("\n").split(";")
            if nur and p[6] != nur:
                continue
            key = f"{p[7]}_{p[9]}"
            meta[key] = {"kreis": p[8], "gmd": p[10]}
            gruppen[key][p[14]].append([p[15], p[16], round(float(p[18]), 1), round(float(p[19]), 1)])
            stand = max(stand, p[20])
            n += 1
    index = []
    gesamt = 0
    for key, strassen in sorted(gruppen.items()):
        e0 = min(a[2] for v in strassen.values() for a in v)
        n0 = min(a[3] for v in strassen.values() for a in v)
        out = {"e0": e0, "n0": n0, "s": {}}
        for strasse, adr in sorted(strassen.items()):
            adr.sort(key=lambda a: (int("".join(c for c in a[0] if c.isdigit()) or 0), a[1]))
            out["s"][strasse] = [[a[0], a[1], round((a[2] - e0) * 10), round((a[3] - n0) * 10)] for a in adr]
        roh = json.dumps(out, separators=(",", ":"), ensure_ascii=False)
        with open(os.path.join(outdir, key + ".json"), "w", encoding="utf-8") as w:
            w.write(roh)
        gesamt += len(roh.encode())
        index.append({"key": key, **meta[key], "strassen": len(strassen), "adressen": sum(len(v) for v in strassen.values())})
    json.dump({"stand": stand, "quelle": "Geobasis NRW, Gebäudereferenzen (dl-zero-de/2.0)", "gemeinden": index},
              open(os.path.join(outdir, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"{n} Adressen, {len(gruppen)} Gemeinden, {gesamt/1e6:.1f} MB, Stand {stand}")


if __name__ == "__main__":
    main()
