# Spike-Ergebnisse

Ergebnisse der Spikes aus [`../SPIKES.md`](../SPIKES.md). Aussagen zu Genauigkeit sind **vorläufig**, solange keine unabhängigen Referenzmaße vorliegen.

## S1 – Luftbild im Browser: **bestanden** (mit Vorbehalt Safari/iPhone), 2026-10-09

Code: [`s1-luftbild`](s1-luftbild) (statische Seite mit MapLibre, Testskript mit Playwright). Testseite: <https://pv-dachplaner-spikes.netlify.app> (Netlify-Site `pv-dachplaner-spikes`, nur für Spikes).

| Frage | Ergebnis |
|---|---|
| Direkter Abruf aus dem Browser (CORS)? | **Ja.** Der Server antwortet mit `Access-Control-Allow-Origin` passend zur Herkunft. Kein CORS- und kein Kartenfehler in Chromium, sowohl von `localhost` als auch von `https://pv-dachplaner-spikes.netlify.app`. |
| 10 cm pro Pixel? | **Ja.** Die Metadaten melden je Kachel `Bodenauflösung 0.10`, `RGBI`, 8 Bit. In der Karte sind PV-Module, Dachfenster und Lüfter einzeln erkennbar ([Bild](s1-luftbild/evidence/stadion-25832-0.2m.jpg)). Es sind **True-Orthophotos**: Das Stadiondach zeigt keine Gebäudeschrägstellung. |
| Maßhaltigkeit | **Gut.** Mittelkreise (Radius laut Regelwerk 9,15 m außen, ca. 9,09 m Linienmitte) im Bild gemessen: 9,06 m und 9,10 m, Abweichung unter 1 %. Grundlage: Abruf in EPSG:25832 mit 0,2 m je Pixel, Kreisanpassung an die Linienpixel. |
| Aufnahmedatum abfragbar? | **Ja.** `GetFeatureInfo` auf `nw_dop_utm_info`: Beispiel Bielefeld Kachel `32466_5764`, Bildflugdatum **13.08.2024**. Damit kann die App das Alter des Bildes anzeigen. |
| Infrarot verfügbar? | **Ja.** `nw_dop_nir` und `nw_dop_cir` liefern dieselbe Auflösung (für S6 nutzbar). |
| Dateigröße je 512-px-Kachel | **PNG 584 kB, JPEG 47 kB** (12-mal kleiner). |
| Ladezeit | In der Testumgebung (über einen Proxy, daher nicht repräsentativ): JPEG 512 px Median 0,5–0,8 s, PNG 512 px Median 1,5 s, PNG 256 px Median 1,0 s. Auf iPhone und Mobilfunk **noch zu messen**. |
| Sinnvolle Maximalstufe | MapLibre-Zoom 19 mit 512-px-Kacheln entspricht in OWL etwa 9,2 cm je Bildschirmpixel; mehr Zoom vergrößert nur noch. |

**Entscheidung:** Das Luftbild wird **direkt aus dem Browser** geladen, ein Proxy ist nicht nötig. Für die Anzeige **JPEG mit 512-px-Kacheln**. Für die Erkennung (S6) wird je Dach ein Ausschnitt in EPSG:25832 mit 0,1 m je Pixel geholt; ob JPEG-Artefakte die Erkennung stören, prüft S6.

**Vorbehalte / offen**
- **Safari auf dem iPhone und Edge auf Windows wurden noch nicht geprüft.** Getestet wurde Chromium (headless). Bitte <https://pv-dachplaner-spikes.netlify.app> auf dem iPhone öffnen: Karte muss erscheinen, Zoom und Wischen müssen flüssig sein, „Aufnahme-Info“ muss ein Datum zeigen.
- Es ist keine Abrufbegrenzung dokumentiert (Dienstbeschreibung: keine Zugriffsbeschränkung). Bei vielen gleichzeitigen Nutzern könnte ein eigener Zwischenspeicher sinnvoll werden. Das ist **[prüfen]** vor dem Rollout und kein Hindernis für M1.
- Netzgeschwindigkeit auf Mobilfunk unbekannt (siehe oben).

## S2 – Dachflächen aus den NRW-Gebäudedaten (LoD2): **technisch bestanden, Genauigkeit vorläufig**, 2026-10-09

Code: [`s2-lod2`](s2-lod2) (`parse_tile.py` liest eine Kachel, berechnet je Dachfläche Neigung, Ausrichtung und Fläche aus den 3D-Punkten und schreibt ein kompaktes Austauschformat).

**Bereitstellung**

| Punkt | Ergebnis |
|---|---|
| Fundstelle | `https://www.opengeodata.nrw.de/produkte/geobasis/3dg/lod2_gml/lod2_gml/` mit Verzeichnis `index.json` |
| Kacheln | **35.022** Kacheln zu je 1 km², davon 2.376 leer; Name `LoD2_32_<Ost-km>_<Nord-km>_1_NW.gml` (UTM 32, Koordinate in Kilometern) |
| Umfang | 219,6 GB unkomprimiert; Median 1,7 MB, 90 % unter 20,7 MB, größte 97 MB; Bielefelder Stadion-Kachel 22,6 MB |
| Format | CityGML **1.0** (reines XML, keine Kompression), Koordinaten ETRS89/UTM32 mit Höhen |
| Stand | Alle Kacheln vom 26.05.2026; je Gebäude `Grundrissaktualitaet` (Beispiel 01.07.2025) |
| Abruf | Server erlaubt Browser-Zugriff (`Access-Control-Allow-Origin: *`) und Teilabrufe (`Accept-Ranges`). Eine 43-MB-Kachel kam in der Testumgebung in 3 s. |
| WFS für einzelne Gebäude | Nicht gefunden. Es gibt nur die Kachelpakete (und den Download-Client). |

**Inhalt je Gebäude:** Dachform als ADV-Code (`roofType`), Gebäudehöhe, Dachflächen (`RoofSurface`) als 3D-Polygone, Grundriss. Berechnet werden daraus Neigung, Ausrichtung (Fallrichtung), Schrägfläche. Die Dachform-Codes (z. B. 1000 Flachdach, 2100 Pultdach, 3100 Satteldach, 3200 Walmdach) sind aus der AdV-Codeliste erinnert **[prüfen]**.

**Messungen**

| Messung | Ergebnis |
|---|---|
| Parsen (streamend, Python/lxml) | 43-MB-Kachel in **1,4 s**, 30 MB Arbeitsspeicher; 31-MB-Kachel in 1,1 s |
| Inhalt zweier Testkacheln | Bielefeld-Wohngebiet: 1.476 Gebäude, 4.939 Dachflächen; Detmold-Land: 1.797 Gebäude, 6.382 Dachflächen |
| Plausibilität der Neigung | Satteldach: Median 35,2° / 36,7° (10–90 %: 29–48°); Walmdach 42° / 39°; Pultdach 5–6°. Das passt zu Erfahrungswerten. |
| Anteil Dachformen | Flach ca. 22 %, Satteldach ca. 20 %, Pultdach ca. 16 %, ohne Angabe ca. 20 % (meist Nebengebäude), Mischform ca. 14 % |
| Flächen ab 10 m² | 3.796 bzw. 4.607, davon 15–16 % flach, ca. 75 % mit 10–60° Neigung |
| Lage gegen Luftbild (Sichtprüfung) | **Gut.** In der Überlagerung ([Bild](s2-lod2/evidence/lod2-ueber-luftbild.jpg)) liegen Dachkanten, Grate und Kehlen eines Walmdachs und einer Halle mit PV auf den sichtbaren Kanten (wenige Pixel bei 10 cm). |
| Lage, rechnerisch | **Nicht belastbar.** Kantenabgleich an 20 Gebäuden ergab Median |Versatz| 0,7 m, ist aber durch Dachüberstand, Schatten und Bäume verzerrt. Wird erst mit Referenzdaten überprüft. |
| Schrägfläche gegen 3D-Daten | **Bestanden.** 32 echte Dachflächen (Satteldach, Walmdach, Pultdach, Flachdach, UTM-Koordinaten) durch den Geometrie-Kern: Abweichung der Schrägfläche zur unabhängig aus den 3D-Punkten berechneten Fläche unter 0,5 % (Test in `geometry-core`). |
| Kompaktes Format | **0,64 / 0,87 MB je Kachel, gzip 0,18 / 0,25 MB** (statt 32 / 43 MB GML) |

**Hochrechnung** (grob, obere Schätzung; ländliche Kacheln sind kleiner)
- **OWL** (Rechteck um Bielefeld, Paderborn, Gütersloh, Herford, Minden, Lippe, Höxter): ca. 5.900 nicht leere Kacheln, 32 GB Download, rund 20 Minuten reine Rechenzeit, **ca. 1,3 GB** Ergebnis.
- **Ganz NRW:** ca. 32.600 nicht leere Kacheln, ca. 7 GB Ergebnis.

**Grenzen von LoD2**
- Gauben, Dachfenster, Kamine und Aufbauten sind **nicht** enthalten. Sie kommen später aus der Erkennung oder manuell.
- Neu- und Anbauten nach dem Grundrissstand fehlen (Beispiel im Bild: Gartenhäuser rechts). Der Stand je Gebäude ist abrufbar und wird in der App angezeigt.
- Rund 20 % der Gebäude haben keine Dachform (Nebengebäude).

**Prüfung der Erfolgskriterien**
- Extraktion unter 3 s je Gebäude: **erfüllt** mit Vorverarbeitung (Kachel aus dem Speicher laden statt 3–97 MB Rohdaten parsen).
- Neigung ±5°, Ausrichtung ±10° bei 80 % der Testdächer: **noch nicht prüfbar** (keine unabhängigen Referenzmaße). Plausibilität gegeben.
- Umrissversatz unter 0,5 m bei 80 %: Sichtprüfung gut, **rechnerisch offen**.

**Entscheidung: Weg B (Vorverarbeitung).** Ein Aufbereitungsprogramm lädt die Kacheln, schreibt je Kachel eine kleine komprimierte Datei mit den Dachflächen, und die App holt beim Antippen nur die eine Kachel (ca. 0,2 MB). Das braucht keinen Server zur Laufzeit. Rohdaten pro Anfrage (Weg A) lohnen sich nicht: 3 bis 97 MB je Aufruf, ein Gebäude nutzt aber nur Bruchteile davon. Weg C (Zwischenspeicher) entfällt, weil die Aufbereitung für OWL nur etwa eine halbe Stunde dauert.

**Offen für S3:** Wo liegen die rund 1,3 GB (OWL) bzw. 7 GB (NRW) kostenlos, und wer führt die Aufbereitung aus (z. B. ein Netlify-fremder Job)? Der Plan in `PLAN.md` Kap. 8 wird entsprechend angepasst.

## S4 – Geometrie-Kern: **bestanden** (2026-10-09)

Code: [`../packages/geometry-core`](../packages/geometry-core) (TypeScript, Tests mit Vitest).

**Ergebnis:** 26 Tests grün, davon ein Zufallstest mit 300 zufälligen Dächern (gedreht, konkav, mit Hindernissen, Randabstand 0/10/20 cm). Der Kern rechnet Schrägfläche, Randabstand, Hindernisabzug und Modulbelegung.

| Prüfung | Ergebnis |
|---|---|
| Rechenbeispiel aus `PLAN.md` 6.4 (10 × 5 m, 35°) | 61,04 m², **24 Module hochkant**, 11,04 kWp |
| Quer statt hochkant im selben Beispiel | **25 Module** (der Kern zeigt die bessere Ausrichtung) |
| Randabstand 20 cm / 10 cm im Beispiel | weiterhin 24 Module; nutzbare Fläche = (10 − 0,4) × (6,10 − 0,4) auf 0,01 m² |
| Hindernis wird in der Dachebene abgezogen | Fläche × 1/cos(Neigung) |
| Überlappende Hindernisse | keine Doppelzählung (Summe aus Rand, Hindernis und Rest = Dachfläche) |
| Drehinvarianz | gleiche Modulzahl und Fläche bei Drehung des Dachs um beliebige Winkel |
| Raster 5 cm gegen feine Suche 1 cm | höchstens 1 Modul weniger |
| Neigung 90° / negativ / NaN, zu wenige Punkte | werden abgelehnt (`RangeError`) |
| Laufzeit 150-m²-Dach, 5 Hindernisse, beide Ausrichtungen | **ca. 50 ms** in Node; längster Zufallsfall (großes Dach) 300 ms |

**Wichtige Entscheidungen aus dem Spike**

1. **Geometrie-Bibliothek: `clipper-lib`** (Clipper 6, ganzzahlig, Boost-Lizenz). Geprüft und verworfen:
   - `polygon-clipping`: stürzte im Zufallstest mit „Unable to find segment in SweepLine tree“ bzw. „Unable to complete output ring“ ab (Rechenrauschen bei gedrehten Dächern).
   - `clipper2-js`: Der Offset (Randabstand) lieferte falsche Ergebnisse (halber Abstand und Verschiebung). Boolesche Operationen nicht weiter geprüft.
2. **Randabstand** ist ein echter Abstand zur Kante (Rundung nur an einspringenden Ecken), keine Verkleinerung mit abgerundeten Außenecken. Außenecken bleiben scharf, wie bei einem Rechteckdach nötig.
3. **Lokaler Ursprung:** Der Kern rechnet um den Dachmittelpunkt. Rohe UTM-Koordinaten (Millionen Meter) würden die Genauigkeit verschlechtern. Die App darf EPSG:25832-Koordinaten direkt übergeben.
4. **Rasterauflösung:** Intern 0,1 mm. Flächen sind damit auf etwa 0,01 m² genau.
5. **Belegung v1:** Raster mit Versatzsuche (5 cm) plus bündig zu den Gebietsrändern; hochkant und quer werden beide berechnet.

**Noch offen / bewusst vereinfacht**
- Modulreihen sind an der Dachebene ausgerichtet, nicht frei drehbar.
- Nicht-ebene Dächer werden als mehrere ebene Flächen berechnet, die der Aufrufer liefert.
- Laufzeit auf dem iPhone muss separat gemessen werden **[prüfen]**.
- Referenzdächer aus der Praxis folgen, sobald Daten da sind.
