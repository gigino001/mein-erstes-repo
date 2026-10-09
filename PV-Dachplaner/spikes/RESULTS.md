# Spike-Ergebnisse

Ergebnisse der Spikes aus [`../SPIKES.md`](../SPIKES.md). Aussagen zu Genauigkeit sind **vorläufig**, solange keine unabhängigen Referenzmaße vorliegen.

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
