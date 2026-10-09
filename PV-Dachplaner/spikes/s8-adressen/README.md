# S8 – Adresssuche

```bash
curl -O https://www.opengeodata.nrw.de/produkte/geobasis/lk/akt/gebref_txt/gebref_EPSG25832_ASCII.zip
unzip gebref_EPSG25832_ASCII.zip                       # ergibt gebref.txt (685 MB, ganz NRW)
python3 -I build_index.py gebref.txt owl Detmold       # Index für Regierungsbezirk Detmold (OWL)
python3 -I search_test.py owl                          # Trefferquote mit verfälschten Eingaben
```

Ergebnisse: [`../RESULTS.md`](../RESULTS.md).
