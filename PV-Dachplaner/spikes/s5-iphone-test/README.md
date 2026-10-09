# S5 – KI im Browser (iPhone-Test)

Testseite: <https://pv-dachplaner-ki-test.netlify.app>. Lädt MobileSAM (ca. 45 MB, von Hugging Face) und die ONNX-Runtime (ca. 25 MB WASM), analysiert ein Beispieldach und segmentiert angetippte Objekte. „Bericht kopieren“ liefert die Messwerte.

```bash
cd site && python3 -m http.server 8766 --bind 127.0.0.1    # lokal
npm install && node run-test.mjs                            # Headless-Messung (BASE=… für die Netlify-Seite)
```

`site/_headers` setzt Cross-Origin-Isolation, damit mehrere Threads laufen. Ergebnisse: [`../RESULTS.md`](../RESULTS.md).
