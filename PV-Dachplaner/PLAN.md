# PV-Dachplaner – Projektplan

Stand: 2026-10-09 · Status: **Planung, es gibt noch keinen Code** · Version: 0.1 (Entwurf zur Abstimmung)

Aussagen mit **[prüfen]** stammen aus Recherche oder Erinnerung und sind noch nicht in der Praxis verifiziert. Sie werden in den Spikes (Kap. 13) geklärt, bevor etwas darauf aufgebaut wird.

---

## 1. Ziel

Ein Werkzeug, das ein Dach in NRW anhand von Luftbild und Gebäudedaten vermisst, Hindernisse darauf erkennt und daraus die **nutzbare Fläche** und die **Anzahl PV-Module** berechnet. Es dient der Planung beim Kunden und der Übergabe an Installateure.

**Nutzer**
- Außendienstler (Hauptnutzer): erfassen ein Dach vor Ort oder am Schreibtisch.
- Interessenten und Kunden: sehen die Planung als Veranschaulichung.
- Installateure: erhalten Ergebnis und Maße (PDF, geteiltes Projekt).

**Erfolgskriterium (MVP):** Ein Außendienstler gibt eine Adresse ein, bekommt in unter 5 Minuten eine belastbare Modulzahl mit PDF, und die Zahl weicht bei Testdächern nicht systematisch von einer manuellen Planung ab (Toleranz legen wir in Kap. 12 fest).

## 2. Festgelegte Entscheidungen

| Thema | Entscheidung |
|---|---|
| Region | Nur NRW (später erweiterbar) |
| Plattform | iPhone und Windows-Desktop, **eine Codebasis als PWA** |
| Offline | Nicht nötig |
| Kosten | Möglichst 0 € laufend |
| Datenquellen | NRW-Luftbild (DOP, 10 cm) und NRW-3D-Gebäudemodell (LoD2); manuelles Zeichnen als Fallback |
| Erkennung | Automatisch, **jederzeit manuell korrigierbar**; unsichere Funde werden angezeigt |
| Berechnung | Dachfläche minus Hindernisse; Randabstände **optional zuschaltbar** |
| Modul | 115 cm × 178 cm, bevorzugt **hochkant** (lange Kante entlang des Gefälles) |
| Ausgabe | Fläche, Modulanzahl, PDF, geteiltes Projekt |
| Teilen | Projekte sind zwischen Kollegen teilbar (Konten nötig) |
| Hosting | Netlify (wird bereits für `Routenplaner` genutzt) |

## 3. Nicht-Ziele (vorerst)

- Statik, Dachlast, Brandschutz, Blitzschutz, Netzanschluss – keine verbindliche Fachplanung (siehe Haftungshinweis, Kap. 11).
- Ertragsprognose, Wirtschaftlichkeit, Verschattungssimulation.
- Deutschland außerhalb NRW.
- Offline-Betrieb.
- Native Store-Apps (nur wenn die PWA an echte Grenzen stößt).

## 4. Nutzerfluss und Bildschirme

1. **Projektliste** – eigene und geteilte Projekte, Suche, Status.
2. **Neues Projekt** – Adresse oder Kartenklick; Kundenname und Notizen.
3. **Dach-Editor** (Kernbildschirm) – Luftbild, Dachflächen, Hindernisse, Parameter.
4. **Ergebnis** – Belegung, Zahlen, Vergleich hochkant/quer.
5. **Export** – PDF, Teilen-Link.
6. **Einstellungen** – Modulmaße, Fugen, Randabstände, Konto.

**Dach-Editor, Bedienung**
- Werkzeuge: Dachfläche zeichnen/verschieben, Hindernis zeichnen, Auswahl, Radierer, Undo/Redo.
- Eckpunkte per Touch ziehen, Einrasten (Snapping) an Ecken und Kanten, Zoom bis ca. Stufe 20 (10 cm/Pixel).
- Liste „Zu prüfen“: alle unsicheren Funde mit Vorschaubild; je Eintrag *übernehmen / ändern / verwerfen*.
- Farbcode: sicher erkannt, unsicher, vom Nutzer gesetzt.
- Dachneigung und Ausrichtung je Fläche sichtbar und änderbar (Vorbelegung aus LoD2, sonst Eingabe).
- Mehrere Dachflächen pro Gebäude (z. B. Süd- und Westseite), jede mit eigener Belegung.

## 5. Daten

### 5.1 Luftbild
- Quelle: Digitale Orthophotos NRW (DOP), 10 cm, 4 Kanäle RGB + Infrarot, Zyklus ca. 2 Jahre, True-Orthophoto seit Befliegung 2018, WMS. Lizenz dl-zero-de/2.0.
- Zu klären **[prüfen]**: CORS-Header für Abruf aus dem Browser; maximale Kachelgröße; Stand der Befliegung am Zieladressen; ob der Infrarotkanal separat abrufbar ist (hilft später, Vegetation/Schatten von Hindernissen zu trennen).

### 5.2 3D-Gebäudemodell LoD2
- Quelle: 3D-Gebäudemodell NW LoD2, CityGML, Dachformen mit Neigung und Ausrichtung. Lizenz dl-zero-de/2.0.
- Genauigkeit: Lage wie ALKIS-Grundriss; Höhe laut anderem Bundesland meist ca. 1 m **[prüfen für NRW]**; Standard-Dachformen, Gauben und Details fehlen oft.
- Zu klären **[prüfen]**: CityGML-Version, Kachelgröße und Dateigröße, ob es einen WFS-Dienst gibt, wie aktuell die Daten sind.
- **Strategie:** Phase 1 funktioniert **ohne** LoD2 (Dach zeichnen, Neigung eingeben). LoD2 kommt als Vorbelegung dazu und ist nie Pflicht.

### 5.3 Adresssuche
- Kandidaten: OpenStreetMap Nominatim (Nutzungsbedingungen beachten: wenig Anfragen, Drosselung, Attribution), amtliche Geokodierung **[prüfen]**.

### 5.4 Koordinatensysteme
- Geodaten in **EPSG:25832** (ETRS89/UTM 32N), Anzeige in Web-Mercator. Alle Flächen werden in 25832 berechnet (Meter, flächentreu genug auf Gebäudeebene), nicht in Web-Mercator.

## 6. Berechnungslogik

Die Berechnung ist reine Geometrie ohne UI-Abhängigkeit und kommt als eigenes, getestetes Paket (Kap. 8).

### 6.1 Schrägfläche
Das Luftbild zeigt die Draufsicht. Für eine Dachfläche mit Neigung α gilt:

```
Schrägfläche = Grundrissfläche / cos(α)
```

Dasselbe gilt für Hindernisse, die auf dieser Fläche liegen. Zeichnet man ein Hindernis im Bild, rechnet man es mit demselben Faktor um. Pultdach, Satteldach und Walmdach sind Sonderfälle mehrerer ebener Flächen. Flachdächer (α ≈ 0) haben Faktor 1.

### 6.2 Nutzbare Fläche
```
nutzbar = Dachfläche
          − Randabstände (optional: Traufe, First, Ortgang, einzeln einstellbar)
          − Hindernisse (Polygon, optional mit Pufferabstand)
```
Alle Abzüge werden als Polygon-Operationen (Verschneidung, Differenz, Innenversatz) in der **Dachebene** ausgeführt. Die Fläche ist das Ergebnis, nicht die Summe einzelner Abzüge, damit überlappende Hindernisse nicht doppelt zählen.

### 6.3 Modulbelegung
- Modul: 1,15 m (Breite) × 1,78 m (Höhe), **hochkant** = 1,78 m entlang des Gefälles (Traufe zum First).
- Fuge zwischen Modulen: einstellbar. **Startwert 0,02 m, [mit Installateur abstimmen]**.
- Koordinaten der Dachebene: `u` entlang der Traufe, `v` entlang des Gefälles. Das Raster wird in (u, v) gelegt, nicht im Bild.
- Algorithmus (Version 1): Für Rasterverschiebungen (Schritt 5 cm in u und v) werden alle Module gezählt, die **vollständig** in der nutzbaren Fläche liegen; die Verschiebung mit dem Maximum gewinnt. Berechnet für hochkant und quer; Standardanzeige hochkant, die Differenz wird als Hinweis angezeigt.
- Erweiterung später: Reihenweises Auffüllen mit gemischter Ausrichtung, wenn es mehr Module bringt.

### 6.4 Rechenbeispiel (zugleich erster Test)
Satteldach-Seite, Grundriss 10,0 m (Traufe) × 5,0 m (Tiefe), Neigung 35°, keine Hindernisse, keine Ränder, Fuge 0:

- Schrägtiefe = 5,0 / cos 35° = 5,0 / 0,8192 = **6,10 m**; Schrägfläche = 10,0 × 6,10 = **61,0 m²**
- Hochkant: 6,10 / 1,78 = 3,4 → **3 Reihen**; 10,0 / 1,15 = 8,7 → **8 Spalten** → **24 Module**
- Modulfläche gesamt = 24 × 2,047 m² = **49,1 m²**

Mit 2 cm Fuge: 8 × 1,15 + 7 × 0,02 = 9,34 m ≤ 10 m → ebenfalls 24 Module.

## 7. Automatische Erkennung

Ziel: Vorschläge, nie Wahrheit. Alles Unsichere wird angezeigt und ist korrigierbar.

**Klassen** (jeweils mit Information, ob die Fläche abzuziehen ist):
Kamin/Schornstein, Dachfenster, Gaube, Antenne/Sat-Schüssel, Lüfter/Entlüftung, vorhandene PV oder Solarthermie, Dachaufbauten (Technik), Dachrand/Attika.

**Ablauf**
1. Dachumriss (aus LoD2 oder gezeichnet) bestimmt den Ausschnitt.
2. Modell liefert Kandidaten mit **Klasse, Umriss, Konfidenz**.
3. Schwelle bestimmt die Anzeige: *sicher* (automatisch gesetzt), *unsicher* (in „Zu prüfen“), *darunter* (verworfen, abschaltbar sichtbar).
4. Nutzer korrigiert; Korrekturen werden (mit Einwilligung) als Trainingsdaten gesammelt.

**Technik (Spike nötig)**
- Läuft im Browser über ONNX Runtime Web (WASM/WebGPU) auf einem kleinen Segmentierungsmodell; Fallback ist ein Serverdienst. Auf dem iPhone ist der Speicher knapp, deshalb nur kleine Ausschnitte (ein Dach).
- Trainingsdaten: eigene Beschriftung auf offenen NRW-Luftbildern (z. B. mit Label Studio oder CVAT). Umfang **[Schätzung: einige hundert bis tausend beschriftete Dächer, wird im Spike gemessen]**.
- Vorab-Variante ohne eigenes Training: ein vortrainiertes Segmentierungsmodell (z. B. SAM-Familie) liefert Segmente, die der Nutzer per Tipp als Hindernis einordnet.

## 8. Architektur

```
┌──────────────────────────── PWA (iPhone / Windows) ────────────────────────────┐
│ UI (Editor, Listen, PDF)  ·  Karte  ·  Geometrie-Kern  ·  Erkennung (ONNX)     │
└───────────────┬────────────────────────────────────────┬───────────────────────┘
                │ Kartenbilder / Daten                   │ Konten, Projekte, Teilen
        Netlify Functions (Proxy, LoD2-Abfrage)          Datenbank + Auth
                │
        NRW Geobasis (WMS Luftbild, LoD2)
```

**Frontend:** TypeScript, Vite, MapLibre GL JS (WMS als Raster-Quelle), Polygon-Bibliothek für Verschneidung/Versatz (z. B. Clipper-basiert oder turf.js), proj4 für 25832 ↔ Karte, Workbox für die PWA, client-seitiges PDF (z. B. pdf-lib). Framework: React oder Svelte – Entscheidung im Spike.

**Geometrie-Kern:** eigenes Paket ohne UI, vollständig unit-getestet (Kap. 12). Er ist das Herz des Tools und der erste Teil, der gebaut wird.

**Netlify (Antwort auf „geht Netlify?“)**
- **Ja für:** Hosting der PWA und für Netlify Functions (Proxy, falls CORS fehlt; LoD2-Abfrage pro Gebäude).
- **Allein nicht ausreichend für:** Konten und geteilte Projekte; dafür braucht es zusätzlich eine Datenbank mit Anmeldung.
- Optionen für Konten und Teilen **[prüfen, Stand und Gratis-Limits]**:
  - **Supabase** (Anmeldung + Datenbank mit Zeilenrechten): passt gut zu „Projekte teilen“. Auf dem Gratis-Tarif können inaktive Projekte pausieren **[prüfen]**.
  - **Netlify Blobs** plus eigene Anmeldung: weniger Dienste, aber mehr Eigenbau.
  - Netlify Identity ist laut meiner Erinnerung eingestellt bzw. abgekündigt **[prüfen]**; deshalb nicht als Basis geplant.
- Gratis-Limits von Netlify Functions (Laufzeit, Speicher, Aufrufe) begrenzen, wie groß die LoD2-Verarbeitung pro Aufruf sein darf **[prüfen]**.

**LoD2-Verarbeitung – drei Wege, Entscheidung nach Spike**
- **A:** Pro Anfrage die passende Kachel holen und im Function-Aufruf auswerten. Einfach, aber evtl. zu groß/langsam.
- **B:** Daten vorab in kleine Dachflächen-Dateien umwandeln und statisch ablegen. Schnell, aber Speicher- und Aufbereitungsaufwand für ganz NRW.
- **C:** Lazy-Cache: wie A, aber das Ergebnis je Gebäude wird gespeichert.
- Fallback bei allen: ohne LoD2 weiterarbeiten (manuell).

## 9. Datenmodell (Entwurf)

```
Project      id, name, kunde{name, kontakt}, adresse, position(25832), notizen,
             owner, sharedWith[{user, rolle: lesen|bearbeiten}], created, updated
Building     id, projectId, umriss, quelle{lod2|manuell}, lod2Id?
RoofPlane    id, buildingId, umriss, neigungGrad, ausrichtungGrad,
             quelle{lod2|manuell}, randabstand{traufe, first, ortgang}|null
Obstacle     id, roofPlaneId, klasse, umriss, puffer_m, abziehen:boolean,
             herkunft{auto|manuell}, konfidenz?, status{sicher|unsicher|bestätigt|verworfen}
Layout       id, roofPlaneId, modulTyp, ausrichtung{hochkant|quer}, fuge_m,
             offset{u,v}, module[{u,v}], anzahl, ergebnisFlaeche
ModuleType   id, name, breite_m=1.15, hoehe_m=1.78, leistungWp?
```
Alle Geometrien in EPSG:25832 (Meter). Versionsnummer je Projekt, damit gleichzeitiges Bearbeiten durch zwei Kollegen erkannt wird (Konfliktstrategie: zuletzt gespeichert + Warnung; echte Echtzeit-Bearbeitung ist kein Ziel).

## 10. Ausgabe

**PDF (client-seitig)**
- Titelseite: Projekt, Adresse, Datum, Bearbeiter.
- Luftbild mit eingezeichneten Dachflächen, Hindernissen und Modulen, Maßstab und Nordpfeil.
- Tabelle je Dachfläche: Neigung, Ausrichtung, Dachfläche, Abzüge, nutzbare Fläche, Modulzahl (hochkant/quer), Gesamt.
- Annahmenblock: Modulmaße, Fuge, Randabstände, Datenquelle und Stand der Luftbilder, Quellenhinweis.
- Haftungshinweis (Kap. 11).

**Weitere:** Teilen-Link (nur mit Anmeldung), CSV/JSON-Export der Maße für Installateure.

## 11. Recht und Datenschutz (keine Rechtsberatung)

- Kundendaten sind personenbezogen (DSGVO): Datensparsamkeit, Löschfunktion, Hosting-Standort und Auftragsverarbeitung der gewählten Dienste klären **[prüfen]**.
- Nutzungsbedingungen von Nominatim und Kartenbibliotheken einhalten; Quellenangabe für NRW-Daten in PDF und App – auch wenn dl-zero sie nicht verlangt, ist sie sauber.
- Haftungshinweis in App und PDF: Ergebnis ist Planungshilfe auf Basis von Luftbild und Modelldaten; Aufmaß, Statik und Normen vor Ort sind vom Installateur zu prüfen.
- Luftbilder können veraltet sein (Stand anzeigen).

## 12. Qualität und Tests

- **Geometrie-Kern:** Unit-Tests mit Handrechnungen (Beispiel aus 6.4), Randfälle (Hindernis außerhalb, überlappende Hindernisse, sehr schmale Flächen, 0°/90°).
- **Referenzdächer:** 10 bis 20 echte NRW-Dächer, manuell ausgemessen und belegt; Abweichung des Tools wird protokolliert. Zielwert (Startvorschlag): Fläche ±5 %, Modulanzahl ±1 Modul je Dachfläche **[mit dir festlegen]**.
- **Erkennung:** Messung von Treffer- und Fehlerrate je Klasse auf einem getrennten Testsatz.
- **Geräte:** iPhone (Safari/PWA) und Windows (Edge/Chrome); Touch-Bedienung ist Abnahmekriterium.
- **Ende-zu-Ende:** Playwright-Tests für den Kernfluss (Adresse → Dach → Hindernis → Ergebnis → PDF).

## 13. Risiken und Spikes

Jeder Spike ist klein, hat eine Frage und ein klares Ja/Nein.

| # | Frage | Warum wichtig | Ergebnis |
|---|---|---|---|
| S1 | Lässt sich das NRW-Luftbild per WMS direkt im Browser laden (CORS)? In welcher Auflösung? | Sonst Proxy nötig | Ja/Nein + Proxy-Bedarf |
| S2 | Wie sind LoD2-Daten bereitgestellt (Format, Kachelgröße, WFS?) und wie groß ist ein Gebäude-Abruf? | Entscheidet Weg A/B/C | Gewählter Weg |
| S3 | Reicht Netlify Functions (Gratis-Limits) für die LoD2-Abfrage? | Kosten und Machbarkeit | Ja/Nein |
| S4 | Geometrie-Kern: Schrägfläche, Abzüge, Belegung gegen Handrechnung | Kernlogik | Tests grün |
| S5 | Läuft ein kleines ONNX-Modell auf dem iPhone in akzeptabler Zeit/Speicher? | Entscheidet Browser- vs. Server-Erkennung | Messwerte |
| S6 | Wie gut trennt ein Vorab-Modell Hindernisse auf 10-cm-Bildern? | Aufwand der Beschriftung | Trefferquote je Klasse |
| S7 | Konten und Teilen: Supabase vs. Netlify Blobs – Aufwand, Limits, Datenschutz | Entscheidet Backend | Gewählte Lösung |
| S8 | Adresssuche: Nominatim ausreichend oder amtliche Geokodierung? | Nutzbarkeit/Bedingungen | Gewählte Lösung |

**Weitere Risiken**
- Zeichnen per Touch ist fummelig → früh mit echten Nutzern auf dem iPhone testen.
- LoD2 passt nicht zur realen Dachform (Anbauten, Umbauten) → Korrektur muss immer einfach sein.
- Schatten und Bäume über dem Dach im Luftbild → Hinweisfunktion, Nutzer korrigiert.
- iOS-PWA-Einschränkungen (Speicher, Hintergrundverhalten) → früh auf echtem Gerät prüfen.

## 14. Meilensteine

| Meilenstein | Inhalt | Ergebnis |
|---|---|---|
| **M0 Spikes** | S1–S4, S7, S8 | Entscheidungen für Datenzugriff, Backend, Geometrie |
| **M1 Kern** | Karte mit Luftbild, Adresssuche, Dach zeichnen, Neigung eingeben, Hindernisse zeichnen, Fläche und Modulanzahl, lokal speichern | Nutzbar für dich allein |
| **M2 Ausgabe** | PDF, Randabstände optional, hochkant/quer-Vergleich, mehrere Dachflächen | Kundentauglich |
| **M3 Teamarbeit** | Konten, Projekte teilen, Rollen | Nutzbar für Kollegen |
| **M4 LoD2** | Dachflächen, Neigung und Ausrichtung automatisch vorbelegt | Weniger Handarbeit |
| **M5 Erkennung** | S5, S6, Hindernis-Vorschläge mit „Zu prüfen“ | Automatische Erkennung |
| **M6 Politur** | Referenzdächer, Fehlerkorrektur, Rollout | Einsatzreif |

Reihenfolge-Prinzip: **früh etwas Nutzbares (M1/M2) und das riskante Automatisieren (M4/M5) später**, damit Fehlschläge dort das Gesamtprojekt nicht aufhalten.

## 15. Offene Fragen

1. Modulleistung (Wp) oder Modulhersteller – nur Maße oder auch Leistung/kWp im Ergebnis?
2. Fugenabstand und Randabstände (Traufe/First/Ortgang): Startwerte von einem Installateur bestätigen lassen.
3. Toleranz für die Abnahme (Kap. 12) bestätigen.
4. Wer darf Projekte teilen/löschen (Rollenmodell)? Soll es eine Firmen-/Teamstruktur geben?
5. Soll der Kunde selbst einen Lesezugriff (Link) bekommen oder nur ein PDF?
6. Kundenbranding im PDF (Logo, Farben)?
7. Flachdächer: Aufständerung/Neigung der Module relevant (andere Belegungslogik) oder erst später?
8. Mehrere Gebäude pro Projekt (Haus, Garage, Scheune) von Anfang an?

---

## Quellen

- Geobasis NRW, Digitale Orthophotos (open.nrw): https://prod.ckan259.open.nrw.de/zh_Hans_CN/dataset/digitale-orthophotos-nw-geo-nrw/resource/1f6c1638-5c83-4b6c-a594-29aa1483f0b5
- 3D-Gebäudemodell NW LoD2 (open.nrw): https://ckan.open.nrw.de/tl/dataset/3d-gebaudemodell-nw-lod2-geo-nrw/resource/a23b8bb8-9ee8-4a66-8a26-f25ca05df2ec
- Land NRW, 3D-Gebäudemodell mit Dachformen: https://www.land.nrw/pressemitteilung/digitales-3d-gebaeudemodell-von-nrw-ab-sofort-mit-dachformen-verfuegbar
- Solarkataster NRW (nur zur Info, nicht als Datengrundlage eingeplant): https://ckan-open-nrw.nrw.de/dataset/6b1af6af-cd03-4206-a323-894eae1aaf08
