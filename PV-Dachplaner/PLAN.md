# PV-Dachplaner – Projektplan

Stand: 2026-10-09 · Status: **Planung, es gibt noch keinen Code** · Version: 0.10 (Entwurf zur Abstimmung)

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
| Berechnung | Dachfläche minus Hindernisse; Randabstand **optional zuschaltbar**: Standard **20 cm**, im Notfall **10 cm** (Schalter „knapp“), gilt zunächst für alle Dachränder |
| Modul | 115 cm × 178 cm, **460 Wp**, bevorzugt **hochkant** (lange Kante entlang des Gefälles). Der Fugenabstand ist in den Maßen **bereits enthalten**, es gibt keine zusätzliche Fuge. |
| Ausgabe | Fläche, Modulanzahl, Leistung (kWp), **ein PDF mit visueller Ansicht**; kein Kundenzugang, der Kunde bekommt nur das PDF |
| Dachtypen | Geneigte Dächer. **Flachdach ist ausgeschlossen**, soll aber später optional ergänzbar sein (Architektur offen halten) |
| Teilen | Projekte sind zwischen Kollegen teilbar (Konten nötig); **Kollegen dürfen bearbeiten**, es gibt keine reinen Leserechte; **löschen darf nur der Ersteller**; Anmeldung über **Einladungslink** (Magic Link) |
| Projektumfang | **Ein Gebäude pro Projekt** (mit mehreren Dachflächen) |
| PDF | Ohne Firmenbranding, ohne Modulnummerierung/Reihenplan |
| Abnahme | Fläche ±5 %, Modulanzahl ±1 Modul je Dachfläche |
| Hosting | Netlify (wird bereits für `Routenplaner` genutzt) |

## 3. Nicht-Ziele (vorerst)

- Statik, Dachlast, Brandschutz, Blitzschutz, Netzanschluss – keine verbindliche Fachplanung (siehe Haftungshinweis, Kap. 11).
- Ertragsprognose, Wirtschaftlichkeit, Verschattungssimulation.
- Deutschland außerhalb NRW.
- Offline-Betrieb.
- Flachdächer inkl. Aufständerung (später optional, siehe Kap. 6.5).
- Kundenzugang zur App; der Kunde erhält ausschließlich das PDF.
- Native Store-Apps (nur wenn die PWA an echte Grenzen stößt).

## 4. Nutzerfluss und Bildschirme

1. **Projektliste** – eigene und geteilte Projekte, Suche, Status.
2. **Neues Projekt** – Adresse oder Kartenklick; Kundenname und Notizen.
3. **Dach-Editor** (Kernbildschirm) – Luftbild, Dachflächen, Hindernisse, Parameter.
4. **Ergebnis** – Belegung, Zahlen, Vergleich hochkant/quer.
5. **Export** – PDF (einziger Kundenzugang), Projekt für Kollegen teilen.
6. **Einstellungen** – Modulmaße und -leistung, Randabstände, Konto.

**Dach-Editor, Bedienung**
- Werkzeuge: Dachfläche zeichnen/verschieben, Hindernis zeichnen, Auswahl, Radierer, Undo/Redo.
- Eckpunkte per Touch ziehen, Einrasten (Snapping) an Ecken und Kanten, Zoom bis ca. Stufe 20 (10 cm/Pixel).
- Liste „Zu prüfen“: alle unsicheren Funde mit Vorschaubild; je Eintrag *übernehmen / ändern / verwerfen*.
- Farbcode: sicher erkannt, unsicher, vom Nutzer gesetzt.
- Dachneigung und Ausrichtung je Fläche sichtbar und änderbar (Vorbelegung aus LoD2, sonst Eingabe).
- Mehrere Dachflächen pro Gebäude (z. B. Süd- und Westseite), jede mit eigener Belegung. Ein Projekt enthält genau ein Gebäude.

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
- **Entscheidung (S8):** eigener Adressindex aus den amtlichen Gebäudereferenzen (Hauskoordinaten) von Geobasis NRW, je Gemeinde eine kleine Datei (OWL 5 MB gesamt), ohne externen Suchdienst. Fallback: Gebäude auf der Karte antippen.

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
          − Randabstand (optional; Standard 20 cm, „knapp“ 10 cm; zunächst gleich für Traufe, First und Ortgang,
            technisch je Kante einstellbar)
          − Hindernisse (Polygon, optional mit Pufferabstand)
```
Alle Abzüge werden als Polygon-Operationen (Verschneidung, Differenz, Innenversatz) in der **Dachebene** ausgeführt. Die Fläche ist das Ergebnis, nicht die Summe einzelner Abzüge, damit überlappende Hindernisse nicht doppelt zählen.

### 6.3 Modulbelegung
- Modul: 1,15 m (Breite) × 1,78 m (Höhe), **hochkant** = 1,78 m entlang des Gefälles (Traufe zum First).
- Fuge zwischen Modulen: **0 m**, denn der Fugenabstand steckt bereits in den Modulmaßen 1,15 m × 1,78 m. Der Wert bleibt als Einstellung vorhanden (Startwert 0), falls sich Modul oder Montagesystem ändern.
- Leistung: Anzahl × 460 Wp, ausgegeben in kWp (z. B. 24 Module = 11,04 kWp).
- Koordinaten der Dachebene: `u` entlang der Traufe, `v` entlang des Gefälles. Das Raster wird in (u, v) gelegt, nicht im Bild.
- Algorithmus (Version 1): Für Rasterverschiebungen (Schritt 5 cm in u und v) werden alle Module gezählt, die **vollständig** in der nutzbaren Fläche liegen; die Verschiebung mit dem Maximum gewinnt. Berechnet für hochkant und quer; Standardanzeige hochkant, die Differenz wird als Hinweis angezeigt.
- Erweiterung später: Reihenweises Auffüllen mit gemischter Ausrichtung, wenn es mehr Module bringt.

### 6.4 Rechenbeispiel (zugleich erster Test)
Satteldach-Seite, Grundriss 10,0 m (Traufe) × 5,0 m (Tiefe), Neigung 35°, keine Hindernisse, keine Ränder, Fuge 0:

- Schrägtiefe = 5,0 / cos 35° = 5,0 / 0,8192 = **6,10 m**; Schrägfläche = 10,0 × 6,10 = **61,0 m²**
- Hochkant: 6,10 / 1,78 = 3,4 → **3 Reihen**; 10,0 / 1,15 = 8,7 → **8 Spalten** → **24 Module**
- Modulfläche gesamt = 24 × 2,047 m² = **49,1 m²**

Leistung: 24 × 460 Wp = **11,04 kWp**.

### 6.5 Flachdach (später)
Nicht im Umfang. Damit es später ohne Umbau ergänzt werden kann, enthält `RoofPlane` schon ein Feld `typ` (`geneigt` | `flach`), und die Belegung ist als austauschbares Modul gekapselt. Ein Flachdach bräuchte u. a. Aufständerungswinkel, Reihenabstand wegen Verschattung und Ballast, das ist dann eine eigene Belegungslogik.

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
└──────┬─────────────────────────┬──────────────────────────┬────────────────────┘
       │ Luftbild (WMS)          │ Dachflächen-Kacheln      │ Konten, Projekte, Teilen
  NRW Geobasis             Netlify (statisch)           Supabase (Auth + Datenbank, später)
```

**Frontend:** TypeScript, Vite, MapLibre GL JS (WMS als Raster-Quelle), Polygon-Bibliothek für Verschneidung/Versatz (z. B. Clipper-basiert oder turf.js), proj4 für 25832 ↔ Karte, Workbox für die PWA, client-seitiges PDF (z. B. pdf-lib). Framework: React oder Svelte – Entscheidung im Spike.

**Geometrie-Kern:** eigenes Paket ohne UI, vollständig unit-getestet (Kap. 12). Er ist das Herz des Tools und der erste Teil, der gebaut wird.

**Hosting und Dienste (Stand nach S1 bis S3)**
- **App:** rein statische PWA, keine Server-Funktion im Betrieb. Das Luftbild kommt direkt vom NRW-WMS (S1), die Dachflächen aus vorbereiteten Kachel-Dateien (S2).
- **Adressindex:** je Gemeinde eine kleine Datei (OWL 5 MB gzip), erzeugt aus den Gebäudereferenzen, im selben statischen Hosting wie die Dachflächen-Kacheln.
- **Dachflächen-Kacheln:** je 1 km² eine kleine komprimierte Datei (ca. 0,2 MB), erzeugt von einem Aufbereitungsprogramm aus den NRW-CityGML-Kacheln. **Zunächst auf Netlify** (eigene statische Site oder im selben Projekt), mit einem Pilotgebiet (z. B. Bielefeld und Umgebung). Umfang OWL bis ca. 1,3 GB, ganz NRW ca. 7 GB. Bei Platzproblemen später **Cloudflare R2** als Alternative.
- **App-Hosting: Netlify** (Entscheidung des Auftraggebers). Das Gratis-Kontingent (Credits) wird mit den anderen Sites des Kontos geteilt. Gegenmaßnahmen: wenige Produktivveröffentlichungen (je 15 Credits), Vorschau-Adressen für Entwicklungsstände, Verbrauch beobachten (S3).
- **Konten und Teilen:** **Supabase** (Anmeldung per Einladungslink, Datenbank mit Zeilenrechten), **zurückgestellt bis vor M3**, weil noch kein Konto besteht. Bis dahin liegen Projekte lokal auf dem Gerät. Gratis-Projekte pausieren nach 7 Tagen ohne Anfragen (S7 prüft Details).
- Netlify Identity ist laut meiner Erinnerung abgekündigt **[prüfen]** und nicht Basis.

**LoD2-Verarbeitung – Entscheidung: Weg B (Vorverarbeitung)**
- Ein Aufbereitungsprogramm (Python, `spikes/s2-lod2/parse_tile.py` als Grundlage) liest die Kacheln, berechnet je Dachfläche Neigung, Ausrichtung und Schrägfläche und schreibt je Kachel eine komprimierte JSON-Datei. Die App holt beim Antippen nur die Kachel des Standorts.
- Fallback: Ohne Kachel oder bei veralteten Daten zeichnet der Nutzer die Dachfläche selbst.
- Gauben, Dachfenster und Aufbauten stehen nicht im LoD2 und kommen aus Erkennung oder manueller Eingabe.

## 9. Datenmodell (Entwurf)

```
Project      id, name, kunde{name, kontakt}, adresse, position(25832), notizen,
             owner, sharedWith[user] (alle mit Bearbeitungsrecht), created, updated
Building     id, projectId (genau eines je Projekt), umriss, quelle{lod2|manuell}, lod2Id?
RoofPlane    id, buildingId, typ{geneigt|flach, vorerst nur geneigt}, umriss, neigungGrad, ausrichtungGrad,
             quelle{lod2|manuell}, randabstand_m{traufe, first, ortgang}|null  (20 cm, knapp 10 cm)
Obstacle     id, roofPlaneId, klasse, umriss, puffer_m, abziehen:boolean,
             herkunft{auto|manuell}, konfidenz?, status{sicher|unsicher|bestätigt|verworfen}
Layout       id, roofPlaneId, modulTyp, ausrichtung{hochkant|quer}, fuge_m=0,
             offset{u,v}, module[{u,v}], anzahl, ergebnisFlaeche
ModuleType   id, name, breite_m=1.15, hoehe_m=1.78, leistungWp=460
```
Alle Geometrien in EPSG:25832 (Meter). Versionsnummer je Projekt, damit gleichzeitiges Bearbeiten durch zwei Kollegen erkannt wird (Konfliktstrategie: zuletzt gespeichert + Warnung; echte Echtzeit-Bearbeitung ist kein Ziel).

## 10. Ausgabe

**PDF (client-seitig)**
- Titelseite: Projekt, Adresse, Datum, Bearbeiter.
- Luftbild mit eingezeichneten Dachflächen, Hindernissen und Modulen, Maßstab und Nordpfeil.
- Tabelle je Dachfläche: Neigung, Ausrichtung, Dachfläche, Abzüge, nutzbare Fläche, Modulzahl, Leistung in kWp, Gesamt.
- Annahmenblock: Modulmaße und -leistung, Randabstand (20 cm/10 cm), Datenquelle und Stand der Luftbilder, Quellenhinweis.
- Haftungshinweis (Kap. 11).

**Weitere:** Projekte lassen sich nur für angemeldete Kollegen teilen (kein Kunden-Link). Das PDF mit der visuellen Ansicht genügt als Ausgabe für Kunden und Installateure; ein CSV/JSON-Export ist nicht vorgesehen.

## 11. Recht und Datenschutz (keine Rechtsberatung)

- Kundendaten sind personenbezogen (DSGVO): Datensparsamkeit, Löschfunktion, Hosting-Standort und Auftragsverarbeitung der gewählten Dienste klären **[prüfen]**.
- Nutzungsbedingungen von Nominatim und Kartenbibliotheken einhalten; Quellenangabe für NRW-Daten in PDF und App – auch wenn dl-zero sie nicht verlangt, ist sie sauber.
- Haftungshinweis in App und PDF: Ergebnis ist Planungshilfe auf Basis von Luftbild und Modelldaten; Aufmaß, Statik und Normen vor Ort sind vom Installateur zu prüfen.
- Luftbilder können veraltet sein (Stand anzeigen).

## 12. Qualität und Tests

- **Geometrie-Kern:** Unit-Tests mit Handrechnungen (Beispiel aus 6.4), Randfälle (Hindernis außerhalb, überlappende Hindernisse, sehr schmale Flächen, 0°/90°).
- **Referenzdächer:** 10 bis 20 echte NRW-Dächer, manuell ausgemessen und belegt; Abweichung des Tools wird protokolliert. Zielwert (festgelegt): Fläche ±5 %, Modulanzahl ±1 Modul je Dachfläche.
- **Erkennung:** Messung von Treffer- und Fehlerrate je Klasse auf einem getrennten Testsatz.
- **Geräte:** iPhone (Safari/PWA) und Windows (Edge/Chrome); Touch-Bedienung ist Abnahmekriterium.
- **Ende-zu-Ende:** Playwright-Tests für den Kernfluss (Adresse → Dach → Hindernis → Ergebnis → PDF).

## 13. Risiken und Spikes

Jeder Spike ist klein, hat eine Frage und ein klares Ja/Nein.

| # | Frage | Warum wichtig | Ergebnis |
|---|---|---|---|
| S1 | Lässt sich das NRW-Luftbild per WMS direkt im Browser laden (CORS)? In welcher Auflösung? | Sonst Proxy nötig | **Ja**, kein Proxy nötig (nur Safari/iPhone-Test offen), siehe `spikes/RESULTS.md` |
| S2 | Wie sind LoD2-Daten bereitgestellt (Format, Kachelgröße, WFS?) und wie groß ist ein Gebäude-Abruf? | Entscheidet Weg A/B/C | **Weg B** (Vorverarbeitung zu kleinen Kachel-Dateien), siehe `spikes/RESULTS.md` |
| S3 | Reicht Netlify Functions (Gratis-Limits) für die LoD2-Abfrage? | Kosten und Machbarkeit | **Keine Funktionen nötig** (Weg B). Hosting bleibt bei Netlify (Credits beobachten), Kachel-Dateien zunächst als Pilotgebiet auf Netlify; siehe `spikes/RESULTS.md` |
| S4 | Geometrie-Kern: Schrägfläche, Abzüge, Belegung gegen Handrechnung | Kernlogik | **Bestanden**, 26 Tests grün, ca. 50 ms je Dach, siehe `spikes/RESULTS.md` |
| S5 | Läuft ein kleines ONNX-Modell auf dem iPhone in akzeptabler Zeit/Speicher? | Entscheidet Browser- vs. Server-Erkennung | Messwerte |
| S6 | Wie gut trennt ein Vorab-Modell Hindernisse auf 10-cm-Bildern? | Aufwand der Beschriftung | Trefferquote je Klasse |
| S7 | Konten und Teilen: Supabase vs. Netlify Blobs – Aufwand, Limits, Datenschutz | Entscheidet Backend | Gewählte Lösung |
| S8 | Adresssuche: Nominatim ausreichend oder amtliche Geokodierung? | Nutzbarkeit/Bedingungen | **Eigener Adressindex** aus amtlichen Hauskoordinaten, 98–100 % Trefferquote im Prototyp; siehe `spikes/RESULTS.md` |

Die detaillierte Ausarbeitung der Spikes steht in [`SPIKES.md`](SPIKES.md).

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
| **M3 Teamarbeit** | Konten (Supabase-Konto nötig, vorher S7), Projekte teilen, Rollen | Nutzbar für Kollegen |
| **M4 LoD2** | Dachflächen, Neigung und Ausrichtung automatisch vorbelegt | Weniger Handarbeit |
| **M5 Erkennung** | S5, S6, Hindernis-Vorschläge mit „Zu prüfen“ | Automatische Erkennung |
| **M6 Politur** | Referenzdächer, Fehlerkorrektur, Rollout | Einsatzreif |

Reihenfolge-Prinzip: **früh etwas Nutzbares (M1/M2) und das riskante Automatisieren (M4/M5) später**, damit Fehlschläge dort das Gesamtprojekt nicht aufhalten.

## 15. Offene Fragen

Alle Fragen aus der Konzeptphase sind beantwortet. Zuletzt festgelegt: Löschen nur durch den Ersteller, Randabstand 20 cm / 10 cm gilt für alle Kanten gleich, Anmeldung über Einladungslink.

Offen für die Umsetzung (klein, werden im Spike S7 geklärt):
1. Wer erzeugt Einladungslinks (nur Administrator oder jeder Kollege)? Läuft ein Link ab? Vorschlag: Administrator, 7 Tage gültig, einmal nutzbar.
2. Was passiert mit Projekten, wenn der Ersteller ausscheidet (Übertragen an einen Kollegen)?

---

## Quellen

- Geobasis NRW, Digitale Orthophotos (open.nrw): https://prod.ckan259.open.nrw.de/zh_Hans_CN/dataset/digitale-orthophotos-nw-geo-nrw/resource/1f6c1638-5c83-4b6c-a594-29aa1483f0b5
- 3D-Gebäudemodell NW LoD2 (open.nrw): https://ckan.open.nrw.de/tl/dataset/3d-gebaudemodell-nw-lod2-geo-nrw/resource/a23b8bb8-9ee8-4a66-8a26-f25ca05df2ec
- Land NRW, 3D-Gebäudemodell mit Dachformen: https://www.land.nrw/pressemitteilung/digitales-3d-gebaeudemodell-von-nrw-ab-sofort-mit-dachformen-verfuegbar
- Solarkataster NRW (nur zur Info, nicht als Datengrundlage eingeplant): https://ckan-open-nrw.nrw.de/dataset/6b1af6af-cd03-4206-a323-894eae1aaf08
