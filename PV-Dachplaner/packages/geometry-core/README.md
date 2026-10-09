# geometry-core

Rechenkern des PV-Dachplaners: Schrägfläche, Randabstand, Hindernisabzug und Modulbelegung für eine ebene Dachfläche. Keine Oberfläche, keine Netzwerkzugriffe.

```ts
import { computeLayout } from "./src";

const result = computeLayout(
  { outline: [/* Punkte in Metern, z. B. EPSG:25832 */], slopeDeg: 35, azimuthDeg: 180 },
  [{ outline: [/* Kamin */], bufferM: 0.2 }],
  { edgeMarginM: 0.2, orientation: "beste" },
);
// result.moduleCount, result.powerKWp, result.usableAreaM2, result.modules[].corners
```

- `azimuthDeg`: Richtung, in die die Fläche abfällt (0 = Nord, 90 = Ost, 180 = Süd).
- Modul Standard: 1,15 × 1,78 m, 460 Wp, Fuge 0 (steckt in den Maßen), hochkant.
- Alle Details und Entscheidungen: [`../../spikes/RESULTS.md`](../../spikes/RESULTS.md).

```bash
npm install
npm test
npm run typecheck
```
