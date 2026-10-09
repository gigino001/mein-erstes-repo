# S6 – Hinderniserkennung (Vorversuch ohne Training)

MobileSAM (ONNX-Export von Acly, MIT) schlägt Masken vor; die Eingabe ist ein Antippen oder ein Auffälligkeits-Punkt.

```bash
# Modelle (je ca. 16–28 MB) von https://huggingface.co/Acly/MobileSAM laden:
#   mobile_sam_image_encoder.onnx, sam_mask_decoder_multi.onnx   -> Ordner models/
pip install onnxruntime numpy pillow lxml
python3 -I crop_grid.py LOD2_KACHEL.json GEBAEUDE_ID_ENDE out.png               # Ausschnitt mit Gitter
python3 -I sam_tap.py models out_raw.png ergebnis.png "130,101" "205,172"        # Antippen
python3 -I sam_candidates.py models LOD2_KACHEL.json GEBAEUDE_ID_ENDE out.png 1.0 anomaly 22   # Auffälligkeiten
```

Wichtig: Der Encoder erwartet das Bild auf 1024 Pixel (längste Seite) vergrößert, Werte 0..255; der Decoder bekommt die Antippunkte in diesem 1024-Maßstab und die Originalgröße als `orig_im_size`. Ergebnisse: [`../RESULTS.md`](../RESULTS.md).
