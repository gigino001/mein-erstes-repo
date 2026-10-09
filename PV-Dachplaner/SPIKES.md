# PV-Dachplaner – Spike-Plan

Stand: 2026-10-09 · Gehört zu [`PLAN.md`](PLAN.md), Kap. 13 · Status: **Plan, noch nichts ausgeführt**

Ein **Spike** ist ein kleines, zeitlich begrenztes Experiment, das eine einzige Frage mit Ja oder Nein beantwortet. Wir bauen damit keine App, sondern wir räumen Unsicherheiten aus, bevor wir darauf bauen. Jeder Spike hat eine Frage, eine Vorgehensweise, ein messbares Erfolgskriterium und eine Entscheidung, die daraus folgt.

Aussagen mit **[prüfen]** sind noch nicht belegt. Zahlen zu Zeitaufwand und Schwellen sind **Vorschläge** und können angepasst werden.

---

## 0. Spielregeln

- **Zeitbox:** Jeder Spike hat ein festes Zeitlimit. Wird es überschritten, wird abgebrochen und das Ergebnis lautet „nicht belegt“ mit der Begründung, wo es hakt.
- **Ergebnisse** stehen in `PV-Dachplaner/spikes/RESULTS.md`: Frage, Messwerte, Ergebnis (Ja/Nein/Teilweise), Entscheidung. Wegwerf-Code liegt unter `PV-Dachplaner/spikes/sN-name/` und wird nicht in die App übernommen. Nur der Geometrie-Kern (S4) wird die Grundlage der App.
- **Nach jedem Spike** wird `PLAN.md` angepasst (Architektur Kap. 8, Risiken Kap. 13), und die Entscheidung wird dort festgehalten.
- **Nur Testdaten:** Keine echten Kundendaten in Spikes. Testadressen sind öffentlich sichtbare Gebäude.
- **Reihenfolge:** Erst die Spikes, die die Architektur entscheiden (S1, S2, S3), parallel dazu der unabhängige Kern (S4), dann Konten (S7), Adresssuche (S8) und zuletzt die Erkennung (S5, S6).

## 1. Übersicht

| # | Frage (Ja/Nein) | Zeitbox (Schätzung) | Hängt ab von | Entscheidet über |
|---|---|---|---|---|
| S1 | Lässt sich das NRW-Luftbild direkt im Browser nutzen, in 10-cm-Qualität? | ½ Tag | – | Proxy ja/nein |
| S2 | Können wir Dachflächen (Neigung, Ausrichtung) aus den NRW-Gebäudedaten zuverlässig und schnell gewinnen? | 1–2 Tage | – | LoD2 ja/nein, Weg A/B/C |
| S3 | Reichen die Gratis-Limits von Netlify für die Verarbeitung? | ½ Tag | S2 | Hosting der LoD2-Abfrage |
| S4 | Berechnet der Geometrie-Kern Fläche und Modulzahl richtig? | 2–3 Tage | – | Kernbibliothek und Algorithmus |
| S5 | Läuft ein kleines KI-Modell auf dem iPhone im Browser? | 1 Tag | – | Erkennung im Gerät oder auf einem Server |
| S6 | Erkennt ein Modell Hindernisse gut genug, um sie vorzuschlagen? | 2–3 Tage | S1, Testdächer | Automatik ja/nein, Schwellenwerte |
| S7 | Welche Lösung für Konten, Einladungslink und geteilte Projekte? | 1 Tag | – | Backend-Wahl |
| S8 | Welche Adresssuche trifft das richtige Gebäude? | ½ Tag | – | Adresssuche |

**Empfohlene Reihenfolge:** S1 → S2 → S4 (parallel zu S2) → S3 → S8 → S5 → S6; **S7 (Konten) zurückgestellt bis vor M3**, weil noch kein Supabase-Konto besteht. Insgesamt grob 9 bis 13 Arbeitstage, falls nichts Unerwartetes auftaucht.

## 2. Gemeinsame Grundlage: Testdach-Set

Fast alle Spikes brauchen dieselben Beispieldächer. **Das ist das Wichtigste, was ich von dir brauche.**

**Umfang:** 15 bis 20 Gebäude in NRW, möglichst aus deinem Alltag (Gebiet, in dem ihr verkauft).

**Auswahl abdecken:**
- Satteldach (mehrere), Walmdach, Pultdach, Krüppelwalm, Zeltdach
- Dächer mit Gauben, Dachfenstern, Kamin, Antenne/Sat, Lüfter
- Dach mit vorhandener PV oder Solarthermie
- Reihenhaus, Doppelhaus, Mehrfamilienhaus, Garage/Anbau
- Dach mit Schatten (Bäume) und ein Dach mit Neubau jünger als die Befliegung
- Stadt, Vorort, Land

**Referenzmaße (Wahrheit):** Zu jedem Dach brauchen wir eine unabhängige Messung. Vorschlag in absteigender Genauigkeit:
1. Aufmaß vor Ort oder vorhandenes Aufmaß aus einem Angebot (Traufe, First, Tiefe, Neigung, Hindernisse).
2. Bauzeichnung oder Katasterplan.
3. Mindestens: händisch im Luftbild nachgezeichnet, mit gemessener Neigung (Neigungsmesser/Smartphone-App).

Die Referenzen speichern wir als einfache Datei je Dach (`spikes/testdaecher/<id>.json`: Adresse, Koordinate, Maße, Foto-Hinweise). **Datenschutz:** Nur Dächer, deren Adresse du ins Repo schreiben darfst. Sonst nur Koordinate und Nummer ohne Adresse.

### Vorläufiger Betrieb ohne Referenzdaten

Die Referenzmaße liegen noch nicht vor und können **nachgeliefert** werden. Bis dahin gilt:

| Spike | Ohne Referenzdaten machbar? | Hinweis |
|---|---|---|
| S1 Luftbild | Ja | Maßhaltigkeit wird an einem öffentlich bekannten Maß geprüft (z. B. Fußballfeld, Straßenbreite, Gebäude mit bekanntem Grundriss aus dem Kataster). |
| S2 LoD2 | Teilweise | Technik (Format, Größe, Geschwindigkeit) geht ohne Referenz. Die **Genauigkeit** von Neigung und Umriss wird vorläufig gegen das Luftbild und eine eigene Nachzeichnung geprüft und mit „vorläufig“ gekennzeichnet. |
| S3 Netlify | Ja | Keine Referenzdaten nötig. |
| S4 Geometrie-Kern | Ja | Handrechnungen und Eigenschaftstests genügen; Referenzdächer folgen später als zusätzliche Tests. |
| S5 KI auf dem iPhone | Ja | Läuft mit beliebigen Luftbildausschnitten. |
| S6 Erkennungsqualität | Ja | Ich wähle Dächer in OWL selbst aus und beschrifte sie. Die Beschriftung braucht keine Maße, nur Bilder. |
| S7 Konten | Ja | Keine Referenzdaten nötig. |
| S8 Adresssuche | Ja | Öffentliche Adressen aus OWL genügen. |

**Eigene Testdächer:** Ich wähle 15 bis 20 Dächer in OWL aus (Mix aus Dachformen, Stadt/Land) anhand des Luftbilds, notiere Koordinate und Dachform und zeichne Umriss und Hindernisse nach. Diese Referenz ist **nicht unabhängig** und wird als „vorläufig“ markiert.

**Nachträglich anpassen:** Sobald echte Werte vorliegen (aus früheren Angeboten, einem Aufmaß, Neigungsmessung mit dem Smartphone), werden sie in `spikes/testdaecher/<id>.json` ergänzt. Die Genauigkeitsmessungen aus S2 und die Referenztests aus S4 laufen dann automatisch erneut. Entscheidungen, die auf „vorläufig“ beruhen, werden vor M1 noch einmal bestätigt.

**Wenn du ohnehin vor Ort bist:** Ein Foto vom Dach, die Neigung mit der Wasserwaage-Funktion des iPhones und die geplante Modulanzahl genügen als Referenz für ein Haus.

---

## S1 – Luftbild im Browser

**Frage:** Können wir das NRW-Luftbild direkt aus dem Browser laden, in 10 cm pro Pixel, schnell genug für eine flüssige Karte?

**Was wir schon wissen** (aus der Dienstbeschreibung, abgerufen am 2026-10-09)
- WMS-Dienst `https://www.wms.nrw.de/geobasis/wms_nw_dop`, Version 1.3.0.
- Ebenen: `nw_dop_rgb` (Farbe), `nw_dop_cir` (Farbinfrarot), `nw_dop_nir` (Nahes Infrarot, Graustufen), `nw_dop_utm_info` (Metadaten, abfragbar).
- Koordinatensysteme u. a. EPSG:25832 und EPSG:3857; Bildformate PNG, JPEG, TIFF; max. 5000 × 5000 Pixel je Abruf.
- Kostenlos, Lizenz „Datenlizenz Deutschland – Zero“ laut Dienstbeschreibung.
- Ein Testabruf mit Browser-Herkunft (`Origin`) wurde mit **Statuscode 200, PNG und `Access-Control-Allow-Origin` passend zur Herkunft** beantwortet. Das spricht dafür, dass der direkte Abruf aus dem Browser funktioniert. Es ist aber nur ein Header-Test ohne Browser und noch kein Beweis.
- Rechnung: In Web-Mercator bei 51° nördlicher Breite entspricht Zoomstufe 20 etwa **9,4 cm pro Pixel**. Stufe 20 ist also die sinnvolle Maximalstufe; höher wäre nur vergrößert.

**Vorgehen**
1. Minimale Seite mit MapLibre GL JS und einer Raster-Quelle auf `nw_dop_rgb` (EPSG:3857, Kacheln 256 und 512 px).
2. Läuft sie lokal (`localhost`) **und** auf einer Netlify-Testadresse ohne CORS-Fehler? Browser-Konsole prüfen auf Chrome (Windows), Edge und **Safari auf dem iPhone**.
3. Kachelgröße, Ladezeit (Median und langsamste 10 %), Dateigröße für PNG und JPEG messen; 5 Dächer, Zoom 17 bis 20.
4. Prüfen, ob bei Zoom 20 echte 10-cm-Details sichtbar sind (Dachziegelreihen, Kamin, Dachfenster).
5. Befliegungsdatum je Gebiet über `nw_dop_utm_info` (GetFeatureInfo) auslesen; zeigt es das Aufnahmejahr?
6. Maßhaltigkeit prüfen: Ein Gebäude aus dem Testdach-Set mit bekannter Länge im Bild ausmessen (in EPSG:25832 gerechnet, nicht in Mercator-Pixeln) und mit der Referenz vergleichen.
7. Prüfen, ob `nw_dop_nir` und `nw_dop_cir` in gleicher Auflösung abrufbar sind (für S6).
8. Auf Hinweise zu Abrufbegrenzungen oder Fair-Use achten (Antwortheader, Dokumentation). Bei Auffälligkeiten dokumentieren.

**Erfolgskriterium (Vorschlag)**
- Kein CORS-Fehler in Chrome/Edge (Windows) und Safari (iPhone), lokal und gehostet.
- Mittlere Ladezeit pro Kachel unter 1 s (gute Verbindung), Karte bleibt flüssig bedienbar.
- 10-cm-Details bei Zoom 20 sichtbar.
- Maßabweichung am Referenzgebäude unter 2 %.

**Entscheidung**
- Erfüllt: Luftbild wird **direkt** geladen. Ein Netlify-Proxy ist optional, nur für Zwischenspeicherung.
- Nicht erfüllt (CORS/Geschwindigkeit): **Netlify-Proxy** (Funktion oder Weiterleitung) vor dem Dienst; dann S3 um Bandbreite ergänzen.

---

## S2 – Dachflächen aus den NRW-Gebäudedaten (LoD2)

**Frage:** Können wir aus dem 3D-Gebäudemodell für ein Gebäude schnell und zuverlässig Dachflächen mit Neigung und Ausrichtung gewinnen?

**Was wir schon wissen**
- Die Daten liegen offen vor und enthalten laut Land NRW Dachformen, Ausrichtung und Neigung. Lizenz dl-zero-de/2.0.
- Es gibt ein Verzeichnis `https://www.opengeodata.nrw.de/produkte/geobasis/3dg/lod2_gml/` mit „Einzelkacheln“ (CityGML) und Verzeichnislisten `index.json`/`index.xml`. Der Stand des Verzeichnisses war laut Index am 2026-08-04 aktualisiert.
- Eine WMS-Übersicht zeigt, wo Kacheln existieren: `https://www.wms.nrw.de/geobasis/wms_nw_3d_gm_uebersicht`.
- Es gibt zusätzlich einen „Open Data Downloadclient“ der GDI-NW, der Gebiete zusammenstellt.

**Was wir noch nicht wissen [prüfen]**
- Kachelnamen und -größen (MB), Version von CityGML, Attribute (Dachform, Höhen), Qualität, Abdeckung, ob es einen abfragbaren Dienst (WFS) für einzelne Gebäude gibt.

**Vorgehen**
1. Kacheln und Dateinamen aus dem Verzeichnis lesen. Muster erkennen: Wie rechnet man aus einer Koordinate (EPSG:25832) auf den Kachelnamen um?
2. Drei Kacheln laden (Innenstadt, Vorort, ländlich). Größe, Anzahl Gebäude, Dateiformat dokumentieren.
3. Mit einem kleinen Skript (Python mit `lxml` oder einer CityGML-Bibliothek) Gebäude, Dachflächen (`RoofSurface`) und deren Eckpunkte auslesen. Je Dachfläche aus den 3D-Koordinaten **Neigung** und **Ausrichtung** berechnen (Flächennormale).
4. Für die Testdächer: Neigung, Ausrichtung, Umriss mit den Referenzmaßen und dem Luftbild vergleichen.
5. Prüfen, wie das Gebäude zu einer Klickposition oder Adresse gefunden wird (räumlicher Index über die Kachel).
6. Zeit messen: Wie lange dauert es, ein einzelnes Gebäude aus einer Kachel zu extrahieren? (Lokal; später auf Serverumgebung in S3.)
7. Alternative für Umrisse prüfen: Gibt es offene Gebäudegrundrisse (z. B. Hausumringe/ALKIS) in NRW, die als Fallback taugen? **[prüfen]**
8. Auswerten, wie viele der Testdächer eine nutzbare Dachfläche haben (Gauben, Anbauten und Neubauten fehlen oft).

**Kennzahlen**
- Neigung: Abweichung je Dachfläche gegen Referenz (Grad).
- Ausrichtung: Abweichung (Grad).
- Umriss: Lageversatz gegen Luftbild (Meter) und Flächenabweichung (%).
- Anteil der Testdächer mit brauchbarer Dachfläche (%).
- Extraktionszeit pro Gebäude (s) und Speicherbedarf.

**Erfolgskriterium (Vorschlag)**
- Neigung ±5°, Ausrichtung ±10° bei mindestens 80 % der Testdächer.
- Umrissversatz unter 0,5 m bei mindestens 80 %.
- Extraktion eines Gebäudes unter 3 s in einer Serverumgebung.

**Entscheidung**
- Erfüllt und schnell: **Weg A** (Abruf pro Gebäude, ggf. mit Zwischenspeicher C).
- Erfüllt, aber zu langsam oder zu groß: **Weg B** (Daten vorab zu kleinen Dachflächen-Dateien aufbereiten und statisch hosten, ggf. nur für Gebiete, in denen ihr arbeitet).
- Nicht erfüllt: LoD2 wird nur als **Vorschlag** genutzt oder entfällt zunächst; M1/M2 funktionieren ohne.

---

## S3 – Netlify-Grenzen

**Frage:** Reichen die Gratis-Limits von Netlify für die Verarbeitung (Abruf und Auswertung einer Gebäudekachel) und für einen eventuellen Proxy?

**Vorgehen**
1. Aktuelle Limits des Gratis-Tarifs nachlesen **[prüfen]**: maximale Laufzeit und Speicher einer Funktion, Größe von Anfrage und Antwort, monatliche Kontingente (Netlify hat sein Abrechnungsmodell verändert; nicht aus dem Gedächtnis rechnen).
2. Testfunktion bereitstellen, die eine Beispielkachel aus S2 lädt und ein Gebäude herauslöst. Misst: Laufzeit kalt/warm, Speicher, Antwortgröße.
3. Hochrechnung: Bei z. B. 20 Kollegen × 10 Projekte pro Woche → Aufrufe, Datenvolumen pro Monat.
4. Prüfen, ob Hintergrundfunktionen oder ein Zwischenspeicher (Netlify Blobs) helfen, falls ein Aufruf zu lange dauert.

**Erfolgskriterium (Vorschlag)**
- Ein Aufruf bleibt deutlich unter dem Zeit- und Speicherlimit (mind. 50 % Reserve).
- Hochgerechnet liegt der Verbrauch unter dem Gratis-Kontingent.

**Entscheidung**
- Erfüllt: Weg A/C auf Netlify.
- Nicht erfüllt: Weg B (Vorverarbeitung) oder ein anderer kostenloser Anbieter für Funktionen; Plan Kap. 8 wird entsprechend geändert.

---

## S4 – Geometrie-Kern (Fläche, Abzüge, Modulbelegung)

**Frage:** Liefert der Kern für beliebige Dachflächen und Hindernisse richtige Werte (Schrägfläche, Abzüge, Modulzahl)?

Dies ist der **einzige Spike, dessen Code wir behalten**. Er wird als eigenes Paket ohne Oberfläche geschrieben (TypeScript, Vitest).

**Aufgaben**
1. **Datentypen:** Polygon in Metern (EPSG:25832), Dachfläche mit Neigung und Ausrichtung, Hindernis, Modultyp (1,15 × 1,78 m, 460 Wp, Fuge 0).
2. **Schrägfläche:** Grundrissfläche / cos(Neigung); Grenzfälle 0° und 90° abfangen (Fehlermeldung).
3. **Projektion in die Dachebene:** Koordinaten (u entlang der Traufe, v entlang des Gefälles). Für jede Dachfläche separat. Traufrichtung aus der Ausrichtung, bei Handzeichnung aus der längsten waagerechten Kante (Nutzer kann ändern).
4. **Randabstand:** Verkleinern des Umrisses um 20 cm (oder 10 cm) **mit spitzen Ecken (Gehrung)**, nicht mit gerundeten. Viele Standardfunktionen runden die Ecken ab und würden an Rechteckdächern Fläche verschenken oder falsch lassen. Bibliotheken vergleichen (z. B. Clipper-basiert, turf.js, polygon-clipping) und die geeignete festlegen.
5. **Hindernisse:** Differenz (mit optionalem Puffer); überlappende Hindernisse; Hindernis ragt über den Rand; Hindernis außerhalb.
6. **Modulbelegung:** Raster in (u, v), Verschiebung in 5-cm-Schritten, Maximum bei vollständig enthaltenen Modulen. Hochkant und quer; Anzeige der Differenz.
7. **Ausgabe:** Fläche, Module (hochkant/quer), kWp, Liste der Modulpositionen.
8. **Leistung:** Laufzeit für ein 150-m²-Dach unter 200 ms im Browser und auf dem iPhone **[prüfen]**.

**Tests (Auszug)**
- Rechenbeispiel aus `PLAN.md` 6.4: 10 × 5 m, 35° → 61,0 m², 24 Module, 11,04 kWp.
- Dasselbe mit 20 cm Randabstand: Hand nachrechnen (Nutzfläche ab 9,6 m × 5,70 m Schräge nach Abzug 0,2 m an jeder Kante: 9,6 / 1,15 = 8,3 → 8 Spalten; 5,70 / 1,78 = 3,2 → 3 Reihen; 24 Module).
- Rechteck mit rechteckigem Hindernis in der Mitte.
- Dreieck (Walm), Trapez, L-Form, Dach mit Loch.
- Winzige Dachfläche (kleiner als ein Modul) → 0 Module, kein Absturz.
- Eigenschaftstest: Fläche nach Abzug ≤ Fläche vor Abzug; Module liegen vollständig in der Nutzfläche; keine Überlappung.
- Vergleich mit einer vollständigen Suche (Brute-Force) bei kleinen Dächern: Abweichung höchstens 1 Modul.

**Erfolgskriterium**
- Alle Tests grün; Handrechnungen stimmen auf 0,1 m² genau.
- Abweichung zur Vollsuche höchstens 1 Modul.
- Laufzeit im Rahmen (s. o.).

**Entscheidung:** Gewählte Geometrie-Bibliothek und Belegungsalgorithmus (einfaches Raster oder verbessertes Auffüllen) werden in `PLAN.md` Kap. 6 und 8 festgeschrieben.

---

## S5 – KI-Modell auf dem iPhone

**Frage:** Läuft ein kleines Segmentierungsmodell im Browser des iPhones in akzeptabler Zeit, ohne dass der Browser abstürzt?

**Vorgehen**
1. Zwei bis drei Kandidaten wählen (Größe 10 bis 50 MB, in ONNX-Format): ein kleines Segmentierungsmodell (Instanzsegmentierung wie YOLO-Nano-Klasse) und ein promptbares Modell in einer kleinen Variante **[prüfen, welche aktuell verfügbar und lizenzmäßig frei sind]**.
2. Eine Testseite mit ONNX Runtime Web (WASM, und wenn verfügbar WebGPU) bauen. Beim iPhone prüfen, ob WebGPU im Safari verfügbar ist **[prüfen]**.
3. Auf iPhone (genaues Modell notieren) und Windows-Desktop messen: Ladezeit des Modells, Rechenzeit für einen Ausschnitt 512 × 512 (ein Dach), maximaler Speicher, Abstürze/Neuladen der Seite.
4. Prüfen, ob die Modelldatei nach dem ersten Laden zwischengespeichert wird (Service Worker).

**Erfolgskriterium (Vorschlag)**
- Auf dem iPhone: Modell ≤ 50 MB, erstes Laden akzeptabel, Rechenzeit ≤ 10 s pro Dach, keine Abstürze bei 10 Durchläufen hintereinander.
- Auf Windows: ≤ 3 s pro Dach.

**Entscheidung**
- Erfüllt: Erkennung läuft **im Gerät** (kostenlos, keine Daten verlassen das Gerät).
- Nicht erfüllt: Erkennung auf einem **Server** (kostenloser Anbieter mit CPU suchen) oder zunächst nur auf Windows, auf dem iPhone manuell mit Vorschlag aus dem Server. Plan Kap. 7/8 wird angepasst.

---

## S6 – Qualität der Hinderniserkennung

**Frage:** Wie gut erkennt ein Modell Kamine, Dachfenster, Gauben usw. auf 10-cm-Luftbildern, und lassen sich die Ergebnisse sinnvoll in „sicher“ und „unsicher“ trennen?

**Vorgehen**
1. Die Testdächer aus dem Set (und weitere Ausschnitte, siehe Aufwand) in einem Beschriftungswerkzeug (z. B. Label Studio oder CVAT, beide kostenlos) mit den Klassen aus `PLAN.md` Kap. 7 beschriften.
2. Drei Ansätze testen:
   - **A:** Promptbares Segmentierungsmodell, der Nutzer tippt auf das Hindernis (kein Training).
   - **B:** Vortrainiertes Modell für Gebäude/Dächer plus Regeln (Farbe, Höhe, NIR).
   - **C:** Kleines Modell, auf einigen Dutzend bis Hunderten beschrifteten Beispielen feintrainiert.
3. Den Infrarotkanal (`nw_dop_nir`) einbeziehen, um Bäume und Vegetation von Dachaufbauten zu trennen.
4. Messen je Klasse: Trefferquote (Recall), Fehlalarme, Überdeckung (IoU), Zeit für die manuelle Korrektur pro Dach.
5. Schwellenwerte festlegen: Ab welcher Sicherheit wird ein Fund als „sicher“ automatisch gesetzt, ab welcher Sicherheit erscheint er unter „Zu prüfen“?

**Erfolgskriterium (Vorschlag)**
- Kamine und Dachfenster (häufigste Hindernisse): Recall ≥ 80 % bei Fehlalarmen ≤ 1 je Dach.
- Die Korrektur dauert im Mittel weniger lang als das vollständig manuelle Markieren.
- Jeder fehlende Fund ist für den Nutzer im Bild nachträglich leicht markierbar (Bedienungsprüfung in S6 an echtem iPhone).

**Entscheidung**
- Erfüllt: Automatik wird in M5 gebaut; Schwellenwerte werden übernommen.
- Teilweise: Automatik nur für gut erkannte Klassen (z. B. Dachfenster), Rest manuell.
- Nicht erfüllt: Statt Automatik ein **Antippen-Werkzeug** (Ansatz A) als Hilfe; Vollautomatik wird zurückgestellt. Der Rest des Produkts bleibt unverändert nutzbar.

**Aufwandshinweis:** Das Beschriften ist der größte Posten. Wir beginnen mit den Testdächern (20) und erhöhen die Zahl nur, wenn Ansatz C nötig ist **[Schätzung: einige hundert beschriftete Dächer für ein belastbares Training]**.

---

## S7 – Konten, Einladungslink und geteilte Projekte

**Frage:** Welche kostenlose Lösung deckt Einladungslink-Anmeldung, geteilte Projekte (alle Beteiligten bearbeiten, nur der Ersteller löscht) und Datenschutz ab?

**Anforderungen**
- Anmeldung nur per **Einladungslink** (Magic Link, einmal nutzbar, begrenzte Gültigkeit).
- Rollen: Ersteller (darf löschen) und Mitbearbeiter. Kein reiner Leser.
- Projekt-Daten sind klein (Koordinaten, Umrisse, Einstellungen); Bilder werden **nicht** gespeichert, sondern bei Bedarf aus dem Dienst geladen.
- Standort der Daten in der EU, Auftragsverarbeitungsvertrag möglich **[prüfen]**.
- Konflikterkennung: Zwei Personen speichern gleichzeitig → Warnung (Versionsnummer).
- Löschkonzept: Projekt endgültig löschen auf Wunsch.

**Kandidaten**
- **Supabase:** Anmeldung, Datenbank mit Zeilenrechten (wer darf was), Einladungen. Auf Gratis-Tarifen können inaktive Projekte pausieren und es gibt Speicher-/Nutzerlimits **[prüfen]**.
- **Netlify Blobs plus eigene Anmeldung:** weniger Dienste, mehr Eigenbau; Rechte müssen selbst gebaut werden.
- Anderer Anbieter nur, wenn beide scheitern.

**Vorgehen**
1. Aktuelle Gratis-Limits, Pausen-/Inaktivitätsregeln und Standorte beider Kandidaten nachlesen.
2. Prototyp mit dem besseren Kandidaten: zwei Testkonten, Einladung per Link, Projekt anlegen, teilen, bearbeiten, löschen (nur Ersteller), gleichzeitige Bearbeitung provozieren.
3. Sicherheitscheck: Kann ein Konto auf fremde, nicht geteilte Projekte zugreifen (muss scheitern)? Sind Einladungslinks einmalig nutzbar?
4. Aufwand für die Anbindung an die PWA auf dem iPhone prüfen (Anmeldesitzung bleibt erhalten?).

**Erfolgskriterium**
- Alle oben genannten Rechte funktionieren und lassen sich nicht umgehen.
- Limits des Gratis-Tarifs reichen für Team und Projektzahl.
- Anmeldung bleibt auf dem iPhone-PWA erhalten.

**Entscheidung:** Gewählter Anbieter, Rollenmodell, Löschkonzept; Offene Punkte aus `PLAN.md` 15 (wer erzeugt Einladungen, Übertragen von Projekten) werden festgelegt.

---

## S8 – Adresssuche

**Frage:** Welche kostenlose Adresssuche findet das richtige Gebäude zuverlässig?

**Kandidaten**
- OpenStreetMap-Nominatim (öffentlicher Dienst mit strengen Nutzungsbedingungen: geringe Anfragenzahl, Drosselung, Quellenangabe).
- Photon (auf OpenStreetMap-Daten, öffentlicher Dienst mit fairer Nutzung) **[prüfen]**.
- Amtliche Geokodierung (Land NRW oder Bund) **[prüfen, ob frei nutzbar]**.

**Vorgehen**
1. 30 Adressen testen (Testdächer plus Neubaugebiet, Hausnummernzusätze „12a“, Straßen mit mehreren Ortsteilen, Landadressen).
2. Je Dienst: Trefferquote, Abstand der gefundenen Position zum tatsächlichen Gebäude (Meter), Antwortzeit, Nutzungsbedingungen (reicht die erlaubte Nutzung für ein Team?).
3. Fallback prüfen: Klick auf die Karte, um das Gebäude zu wählen, wenn die Adresse falsch liegt.

**Erfolgskriterium (Vorschlag)**
- Trefferquote ≥ 90 % bei Abstand unter 15 m zum richtigen Gebäude.
- Nutzungsbedingungen erlauben die geplante Nutzung ohne Kosten.

**Entscheidung:** Adresssuche festlegen; Pflicht-Fallback „auf Karte klicken“ bleibt unabhängig davon im Plan.

---

## 3. Abschluss der Spikes

Die Spikes sind abgeschlossen, wenn:
1. `spikes/RESULTS.md` zu jeder Frage ein Ergebnis und die Entscheidung enthält.
2. `PLAN.md` Kap. 8 (Architektur), 13 (Risiken) und 14 (Meilensteine) angepasst ist.
3. Du bestätigt hast, dass M1 auf dieser Grundlage beginnen kann.

## 4. Rahmenbedingungen (geklärt) und offene Eingaben

**Geklärt**
- **Gebiet:** Ostwestfalen-Lippe (OWL: u. a. Bielefeld, Gütersloh, Paderborn, Herford, Minden-Lübbecke, Lippe, Höxter). Testdächer und Adresstests kommen von dort.
- **Geräte:** iPhones mit aktueller iOS-Version; Windows-Desktop. Genaues iPhone-Modell und Windows-Browser werden bei S5 am Gerät festgestellt.
- **Datenschutz:** In den Spikes nur Testadressen, keine echten Kunden.
- **Netlify:** Zugriff über die verbundene Netlify-Anbindung ist vorhanden (Konto mit mehreren Sites; Tarifkennung `nf_team_dev`, Gratis-Limits werden in S3 nachgelesen). Für die Spikes legen wir eine **eigene neue Site** `pv-dachplaner-spikes` an, damit die vorhandenen Sites unberührt bleiben.

**Offen**
1. **Referenzdaten für Testdächer:** liegen noch nicht vor und werden nachgeliefert (siehe „Vorläufiger Betrieb ohne Referenzdaten“ in Kap. 2). Gut geeignet: Adressen aus früheren Angeboten mit der geplanten **Modulanzahl**, falls bekannt auch Dachneigung und Maße.
