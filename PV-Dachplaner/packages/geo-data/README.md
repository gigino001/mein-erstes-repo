# geo-data – Aufbereitung der Geodaten

Skripte, die offene NRW-Daten in kleine Dateien für die App umwandeln. Die Ergebnisse liegen in `app/public/daten/` (nicht im Repository, siehe `.gitignore`) und werden mit der App ausgeliefert.

## Adressen (Paket 9)

```bash
curl -O https://www.opengeodata.nrw.de/produkte/geobasis/lk/akt/gebref_txt/gebref_EPSG25832_ASCII.zip
unzip gebref_EPSG25832_ASCII.zip                 # gebref.txt, ca. 685 MB (ganz NRW)
python3 -I build_adressen.py gebref.txt ../../app/public/daten/adressen Detmold    # Regierungsbezirk Detmold (OWL)
```

Quelle: Geobasis NRW, Gebäudereferenzen (Hauskoordinaten), Stand siehe `index.json`. Lizenzhinweis: siehe `spikes/RESULTS.md` (S8).
