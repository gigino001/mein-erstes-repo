# S1 – Luftbild im Browser

Statische Testseite (`site/`) mit MapLibre, die das NRW-Luftbild per WMS lädt. `run-test.mjs` misst Ladezeiten und prüft auf CORS-Fehler in Chromium.

```bash
cd site && python3 -m http.server 8765 --bind 127.0.0.1   # Terminal 1
npm install && node run-test.mjs                           # Terminal 2 (gegen die laufende Seite)
BASE=https://pv-dachplaner-spikes.netlify.app node run-test.mjs "ts=512&fmt=jpeg"
```

Seitenparameter: `?ts=256|512` (Kachelgröße), `?fmt=png|jpeg`. Ergebnisse: [`../RESULTS.md`](../RESULTS.md).
