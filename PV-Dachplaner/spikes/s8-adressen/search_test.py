#!/usr/bin/env python3
"""Prototyp der Adresssuche über den Gemeinde-Index und Trefferquote mit absichtlich verfälschten Eingaben."""
import gzip
import json
import random
import re
import sys
import unicodedata

IDX = sys.argv[1]  # Ordner mit index.json und *.json.gz
random.seed(7)
index = json.load(open(f"{IDX}/index.json", encoding="utf-8"))


def key(s):
    s = s.lower().replace("ß", "ss")
    s = s.replace("ä", "a").replace("ö", "o").replace("ü", "u")
    s = re.sub(r"[^a-z0-9]", "", s)
    s = s.replace("ae", "a").replace("oe", "o").replace("ue", "u")
    s = re.sub(r"(strasse|str)$", "str", s)
    s = re.sub(r"str(?=[a-z0-9])", "str", s)
    return s


def lev(a, b, limit=2):
    if abs(len(a) - len(b)) > limit:
        return limit + 1
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


gm_keys = {key(g["gmd"]): g for g in index}
cache = {}


def load(k):
    if k not in cache:
        d = json.load(gzip.open(f"{IDX}/{k}.json.gz", "rt", encoding="utf-8"))
        d["keys"] = {}
        for street in d["s"]:
            d["keys"].setdefault(key(street), []).append(street)
        cache[k] = d
    return cache[k]


def search(q):
    """Gibt (Gemeinde, Straße, Hausnummer+Zusatz, Ost, Nord) oder None zurück."""
    q = q.strip()
    toks = re.split(r"[\s,]+", q)
    # Hausnummer: letztes Token oder Token vor dem Ort: Ziffern mit optionalem Buchstaben
    nr = None
    rest = []
    for t in toks:
        m = re.fullmatch(r"(\d{1,4})\s*([a-zA-Z]?)", t)
        if m and nr is None and not re.fullmatch(r"\d{5}", t):
            nr = (m[1], m[2].lower())
        elif re.fullmatch(r"\d{5}", t):
            continue  # PLZ ignorieren
        else:
            rest.append(t)
    # Hausnummer wie "12 a" getrennt
    if nr and nr[1] == "" and rest and re.fullmatch(r"[a-zA-Z]", rest[0]):
        pass
    # Gemeinde: längster Suffix der Resttokens, der einer Gemeinde entspricht
    gm = None
    street_toks = rest
    for take in range(min(3, len(rest)), 0, -1):
        cand = key("".join(rest[-take:]))
        if cand in gm_keys:
            gm = gm_keys[cand]
            street_toks = rest[:-take]
            break
        # Unscharf (Tippfehler im Ort)
        for gk, g in gm_keys.items():
            if lev(cand, gk, 1) <= 1 and len(cand) >= 5:
                gm = g
                street_toks = rest[:-take]
                break
        if gm:
            break
    if not gm or not street_toks:
        return None
    d = load(gm["key"])
    sk = key("".join(street_toks))
    streets = d["keys"].get(sk)
    if not streets:
        best = None
        for k2, v in d["keys"].items():
            dd = lev(sk, k2, 2)
            if dd <= 2 and (best is None or dd < best[0]):
                best = (dd, v)
        if not best:
            # Tippfehler im Namensende (z. B. "Ahorntraße"): eindeutiger Präfix-Treffer
            pk = sk[: max(4, len(sk) - 6)]
            cands = [v for k2, v in d["keys"].items() if k2.startswith(pk)]
            if len(cands) != 1:
                return None
            best = (3, cands[0])
        streets = best[1]
    street = streets[0]
    adr = d["s"][street]
    if nr is None:
        a = adr[0]
    else:
        match = [a for a in adr if a[0] == nr[0] and a[1].lower() == nr[1]]
        if not match:
            match = [a for a in adr if a[0] == nr[0]]
        if not match:
            return None
        a = match[0]
    return gm["gmd"], street, a[0] + a[1], d["e0"] + a[2] / 10, d["n0"] + a[3] / 10


def variants(gmd, street, nr):
    s = street
    yield "exakt", f"{s} {nr}, {gmd}"
    s2 = re.sub(r"[Ss]tra(ß|ss)e", "Str.", s) if re.search(r"[Ss]tra(ß|ss)e", s) else s
    yield "abgekürzt", f"{s2} {nr} {gmd}"
    yield "ohne Umlaute/ß", unicodedata.normalize("NFKD", f"{s} {nr} {gmd}".replace("ß", "ss").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("Ä", "Ae").replace("Ö", "Oe").replace("Ü", "Ue")).encode("ascii", "ignore").decode()
    yield "klein, ohne Satzzeichen", f"{s} {nr} {gmd}".lower().replace(".", "").replace(",", "")
    if len(s) > 6:
        i = random.randrange(2, len(s) - 2)
        yield "Tippfehler (1 Buchstabe fehlt)", f"{s[:i]}{s[i+1:]} {nr}, {gmd}"
    yield "Nummer vor Straße", f"{nr} {s} {gmd}"


def main():
    # Zufallsstichprobe aus allen Gemeinden
    sample = []
    for g in index:
        d = load(g["key"])
        streets = list(d["s"].items())
        random.shuffle(streets)
        for street, adr in streets[:3]:
            a = random.choice(adr)
            sample.append((g["gmd"], street, a[0] + a[1], d["e0"] + a[2] / 10, d["n0"] + a[3] / 10))
    random.shuffle(sample)
    sample = sample[:200]
    stats = {}
    fails = []
    for gmd, street, nr, e, n in sample:
        for name, q in variants(gmd, street, nr):
            r = search(q)
            ok = r is not None and abs(r[3] - e) < 15 and abs(r[4] - n) < 15
            # Mehrdeutige Hausnummern mit gleicher Straße im selben Ort zählen als Treffer, wenn Abstand < 15 m
            s = stats.setdefault(name, [0, 0])
            s[1] += 1
            s[0] += ok
            if not ok and len(fails) < 12:
                fails.append((name, q, r))
    print(f"Stichprobe: {len(sample)} Adressen aus {len(index)} Gemeinden")
    for name, (ok, tot) in stats.items():
        print(f"  {name:<34} {ok}/{tot}  {ok/tot*100:.0f} %")
    print("Beispiele für Fehlschläge:")
    for f in fails:
        print("  ", f)


main()
