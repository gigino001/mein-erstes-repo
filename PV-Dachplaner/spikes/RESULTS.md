# Spike-Ergebnisse

Ergebnisse der Spikes aus [`../SPIKES.md`](../SPIKES.md). Aussagen zu Genauigkeit sind **vorläufig**, solange keine unabhängigen Referenzmaße vorliegen.

## S1 – Luftbild im Browser: **bestanden** (mit Vorbehalt Safari/iPhone), 2026-10-09

Code: [`s1-luftbild`](s1-luftbild) (statische Seite mit MapLibre, Testskript mit Playwright). Testseite: <https://pv-dachplaner-spikes.netlify.app> (Netlify-Site `pv-dachplaner-spikes`, nur für Spikes).

| Frage | Ergebnis |
|---|---|
| Direkter Abruf aus dem Browser (CORS)? | **Ja.** Der Server antwortet mit `Access-Control-Allow-Origin` passend zur Herkunft. Kein CORS- und kein Kartenfehler in Chromium, sowohl von `localhost` als auch von `https://pv-dachplaner-spikes.netlify.app`. |
| 10 cm pro Pixel? | **Ja.** Die Metadaten melden je Kachel `Bodenauflösung 0.10`, `RGBI`, 8 Bit. In der Karte sind PV-Module, Dachfenster und Lüfter einzeln erkennbar ([Bild](s1-luftbild/evidence/stadion-25832-0.2m.jpg)). Es sind **True-Orthophotos**: Das Stadiondach zeigt keine Gebäudeschrägstellung. |
| Maßhaltigkeit | **Gut.** Mittelkreise (Radius laut Regelwerk 9,15 m außen, ca. 9,09 m Linienmitte) im Bild gemessen: 9,06 m und 9,10 m, Abweichung unter 1 %. Grundlage: Abruf in EPSG:25832 mit 0,2 m je Pixel, Kreisanpassung an die Linienpixel. |
| Aufnahmedatum abfragbar? | **Ja.** `GetFeatureInfo` auf `nw_dop_utm_info`: Beispiel Bielefeld Kachel `32466_5764`, Bildflugdatum **13.08.2024**. Damit kann die App das Alter des Bildes anzeigen. |
| Infrarot verfügbar? | **Ja.** `nw_dop_nir` und `nw_dop_cir` liefern dieselbe Auflösung (für S6 nutzbar). |
| Dateigröße je 512-px-Kachel | **PNG 584 kB, JPEG 47 kB** (12-mal kleiner). |
| Ladezeit | In der Testumgebung (über einen Proxy, daher nicht repräsentativ): JPEG 512 px Median 0,5–0,8 s, PNG 512 px Median 1,5 s, PNG 256 px Median 1,0 s. Auf iPhone und Mobilfunk **noch zu messen**. |
| Sinnvolle Maximalstufe | MapLibre-Zoom 19 mit 512-px-Kacheln entspricht in OWL etwa 9,2 cm je Bildschirmpixel; mehr Zoom vergrößert nur noch. |

**Entscheidung:** Das Luftbild wird **direkt aus dem Browser** geladen, ein Proxy ist nicht nötig. Für die Anzeige **JPEG mit 512-px-Kacheln**. Für die Erkennung (S6) wird je Dach ein Ausschnitt in EPSG:25832 mit 0,1 m je Pixel geholt; ob JPEG-Artefakte die Erkennung stören, prüft S6.

**Vorbehalte / offen**
- **Safari auf dem iPhone und Edge auf Windows wurden noch nicht geprüft.** Getestet wurde Chromium (headless). Bitte <https://pv-dachplaner-spikes.netlify.app> auf dem iPhone öffnen: Karte muss erscheinen, Zoom und Wischen müssen flüssig sein, „Aufnahme-Info“ muss ein Datum zeigen.
- Es ist keine Abrufbegrenzung dokumentiert (Dienstbeschreibung: keine Zugriffsbeschränkung). Bei vielen gleichzeitigen Nutzern könnte ein eigener Zwischenspeicher sinnvoll werden. Das ist **[prüfen]** vor dem Rollout und kein Hindernis für M1.
- Netzgeschwindigkeit auf Mobilfunk unbekannt (siehe oben).

## S2 – Dachflächen aus den NRW-Gebäudedaten (LoD2): **technisch bestanden, Genauigkeit vorläufig**, 2026-10-09

Code: [`s2-lod2`](s2-lod2) (`parse_tile.py` liest eine Kachel, berechnet je Dachfläche Neigung, Ausrichtung und Fläche aus den 3D-Punkten und schreibt ein kompaktes Austauschformat).

**Bereitstellung**

| Punkt | Ergebnis |
|---|---|
| Fundstelle | `https://www.opengeodata.nrw.de/produkte/geobasis/3dg/lod2_gml/lod2_gml/` mit Verzeichnis `index.json` |
| Kacheln | **35.022** Kacheln zu je 1 km², davon 2.376 leer; Name `LoD2_32_<Ost-km>_<Nord-km>_1_NW.gml` (UTM 32, Koordinate in Kilometern) |
| Umfang | 219,6 GB unkomprimiert; Median 1,7 MB, 90 % unter 20,7 MB, größte 97 MB; Bielefelder Stadion-Kachel 22,6 MB |
| Format | CityGML **1.0** (reines XML, keine Kompression), Koordinaten ETRS89/UTM32 mit Höhen |
| Stand | Alle Kacheln vom 26.05.2026; je Gebäude `Grundrissaktualitaet` (Beispiel 01.07.2025) |
| Abruf | Server erlaubt Browser-Zugriff (`Access-Control-Allow-Origin: *`) und Teilabrufe (`Accept-Ranges`). Eine 43-MB-Kachel kam in der Testumgebung in 3 s. |
| WFS für einzelne Gebäude | Nicht gefunden. Es gibt nur die Kachelpakete (und den Download-Client). |

**Inhalt je Gebäude:** Dachform als ADV-Code (`roofType`), Gebäudehöhe, Dachflächen (`RoofSurface`) als 3D-Polygone, Grundriss. Berechnet werden daraus Neigung, Ausrichtung (Fallrichtung), Schrägfläche. Die Dachform-Codes (z. B. 1000 Flachdach, 2100 Pultdach, 3100 Satteldach, 3200 Walmdach) sind aus der AdV-Codeliste erinnert **[prüfen]**.

**Messungen**

| Messung | Ergebnis |
|---|---|
| Parsen (streamend, Python/lxml) | 43-MB-Kachel in **1,4 s**, 30 MB Arbeitsspeicher; 31-MB-Kachel in 1,1 s |
| Inhalt zweier Testkacheln | Bielefeld-Wohngebiet: 1.476 Gebäude, 4.939 Dachflächen; Detmold-Land: 1.797 Gebäude, 6.382 Dachflächen |
| Plausibilität der Neigung | Satteldach: Median 35,2° / 36,7° (10–90 %: 29–48°); Walmdach 42° / 39°; Pultdach 5–6°. Das passt zu Erfahrungswerten. |
| Anteil Dachformen | Flach ca. 22 %, Satteldach ca. 20 %, Pultdach ca. 16 %, ohne Angabe ca. 20 % (meist Nebengebäude), Mischform ca. 14 % |
| Flächen ab 10 m² | 3.796 bzw. 4.607, davon 15–16 % flach, ca. 75 % mit 10–60° Neigung |
| Lage gegen Luftbild (Sichtprüfung) | **Gut.** In der Überlagerung ([Bild](s2-lod2/evidence/lod2-ueber-luftbild.jpg)) liegen Dachkanten, Grate und Kehlen eines Walmdachs und einer Halle mit PV auf den sichtbaren Kanten (wenige Pixel bei 10 cm). |
| Lage, rechnerisch | **Nicht belastbar.** Kantenabgleich an 20 Gebäuden ergab Median |Versatz| 0,7 m, ist aber durch Dachüberstand, Schatten und Bäume verzerrt. Wird erst mit Referenzdaten überprüft. |
| Schrägfläche gegen 3D-Daten | **Bestanden.** 32 echte Dachflächen (Satteldach, Walmdach, Pultdach, Flachdach, UTM-Koordinaten) durch den Geometrie-Kern: Abweichung der Schrägfläche zur unabhängig aus den 3D-Punkten berechneten Fläche unter 0,5 % (Test in `geometry-core`). |
| Kompaktes Format | **0,64 / 0,87 MB je Kachel, gzip 0,18 / 0,25 MB** (statt 32 / 43 MB GML) |

**Hochrechnung** (grob, obere Schätzung; ländliche Kacheln sind kleiner)
- **OWL** (Rechteck um Bielefeld, Paderborn, Gütersloh, Herford, Minden, Lippe, Höxter): ca. 5.900 nicht leere Kacheln, 32 GB Download, rund 20 Minuten reine Rechenzeit, **ca. 1,3 GB** Ergebnis.
- **Ganz NRW:** ca. 32.600 nicht leere Kacheln, ca. 7 GB Ergebnis.

**Grenzen von LoD2**
- Gauben, Dachfenster, Kamine und Aufbauten sind **nicht** enthalten. Sie kommen später aus der Erkennung oder manuell.
- Neu- und Anbauten nach dem Grundrissstand fehlen (Beispiel im Bild: Gartenhäuser rechts). Der Stand je Gebäude ist abrufbar und wird in der App angezeigt.
- Rund 20 % der Gebäude haben keine Dachform (Nebengebäude).

**Prüfung der Erfolgskriterien**
- Extraktion unter 3 s je Gebäude: **erfüllt** mit Vorverarbeitung (Kachel aus dem Speicher laden statt 3–97 MB Rohdaten parsen).
- Neigung ±5°, Ausrichtung ±10° bei 80 % der Testdächer: **noch nicht prüfbar** (keine unabhängigen Referenzmaße). Plausibilität gegeben.
- Umrissversatz unter 0,5 m bei 80 %: Sichtprüfung gut, **rechnerisch offen**.

**Entscheidung: Weg B (Vorverarbeitung).** Ein Aufbereitungsprogramm lädt die Kacheln, schreibt je Kachel eine kleine komprimierte Datei mit den Dachflächen, und die App holt beim Antippen nur die eine Kachel (ca. 0,2 MB). Das braucht keinen Server zur Laufzeit. Rohdaten pro Anfrage (Weg A) lohnen sich nicht: 3 bis 97 MB je Aufruf, ein Gebäude nutzt aber nur Bruchteile davon. Weg C (Zwischenspeicher) entfällt, weil die Aufbereitung für OWL nur etwa eine halbe Stunde dauert.

**Offen für S3:** Wo liegen die rund 1,3 GB (OWL) bzw. 7 GB (NRW) kostenlos, und wer führt die Aufbereitung aus (z. B. ein Netlify-fremder Job)? Der Plan in `PLAN.md` Kap. 8 wird entsprechend angepasst.

## S3 – Netlify-Grenzen und Hosting der Dachflächen-Kacheln: **Netlify-Funktionen nicht nötig**, Hosting bleibt bei Netlify, 2026-10-09

Weil S2 den Weg B (Vorverarbeitung) ergeben hat, braucht die App **keine Server-Funktion** für die Gebäudedaten. Die ursprüngliche Frage („Reichen Netlify-Funktionen?“) erübrigt sich. Offen war stattdessen: Wo liegen die Kachel-Dateien, und was heißt das für das Hosting der App?

**Netlify (Recherche, überwiegend Drittquellen, Preisseite vor einer Entscheidung prüfen)**
- Neue Konten (nach 04.09.2025; dein Konto ist vom 28.05.2026) laufen im **Credit-Modell**: Gratis-Tarif 300 Credits im Monat. Eine erfolgreiche Produktivveröffentlichung kostet 15 Credits, also etwa 20 Veröffentlichungen im Monat. Bandbreite, Funktionsrechenzeit und Anfragen zehren vom selben Kontingent. Die genannten Raten widersprechen sich zwischen Quellen (Bandbreite 10 oder 20 Credits je GB).
- Der Gratis-Tarif ist laut Quellen eine **harte Grenze**: Sind die Credits aufgebraucht, werden **alle Sites des Kontos** bis zum nächsten Abrechnungsmonat pausiert.
- **Risiko für dich:** Die Kontingente gelten für das ganze Konto, also auch für deine anderen Sites (z. B. `coco-lashes.de`). Ein stark genutzter Dachplaner oder viele Veröffentlichungen könnten sie mit pausieren. Die genaue Verbrauchsanzeige habe ich nicht geprüft **[prüfen auf app.netlify.com unter Nutzung]**.
- Funktionslaufzeit und maximale Deploy-Größe habe ich nicht belegt gefunden; sie sind für Weg B nicht mehr relevant.

**Cloudflare R2 für die Kachel-Dateien (Recherche, offizielle Preisseite)**
- 10 GB Speicher im Monat gratis, 1 Mio. Schreib- und 10 Mio. Lese-Anfragen im Monat gratis, **Datenabruf (Egress) kostenlos**. Damit passen OWL (ca. 1,3 GB) und sogar ganz NRW (ca. 7 GB) in den Gratis-Rahmen.
- Voraussetzung: ein Cloudflare-Konto von dir (Kreditkarte kann für R2 nötig sein **[prüfen]**).

**Supabase für Konten und Teilen (Recherche, Drittquellen; Preisseite prüfen)**
- Gratis: 2 aktive Projekte, 500 MB Datenbank, 1 GB Dateispeicher, 50.000 aktive Nutzer im Monat.
- **Pausiert automatisch nach 7 Tagen ohne Datenbankanfragen**; Fortsetzen von Hand. Bei einem Team, das täglich arbeitet, kein Problem; in Urlaubswochen ja. Abhilfe: wöchentlicher Ping oder kleine Zahlung später.
- Ob automatische Sicherungen enthalten sind, ist widersprüchlich beschrieben; Projektdaten sind deshalb als ungesichert zu betrachten **[prüfen]**.

**Aufbereitung der Kacheln**
- OWL: ca. 32 GB Download und ca. 20 Minuten Rechenzeit (S2). Das passt in einen kostenlosen Lauf, z. B. mit GitHub Actions (bei öffentlichen Repos unbegrenzt, bei privaten ein monatliches Kontingent **[prüfen]**), oder lokal auf einem Rechner mit Python.
- Hochladen nach R2 erfordert einen Zugangsschlüssel von dir (als geheimer Wert in der Pipeline, nie im Repository).

**Entscheidung (mit deiner Vorgabe: Hosting bleibt bei Netlify)**
1. **Keine Netlify-Funktionen im Betrieb.** Die App ist rein statisch.
2. **App-Hosting: Netlify** (deine Entscheidung). Das Credit-Risiko ist beherrschbar, wenn wir es im Blick behalten:
   - Das Luftbild kommt direkt vom NRW-Dienst und belastet Netlify nicht.
   - Eine Kachel-Abfrage ist etwa 0,2 MB groß. Bei 20 Nutzern mit je 200 Abfragen im Monat sind das rund 0,8 GB, nach den genannten Raten etwa 8 bis 16 Credits von 300.
   - Der größere Posten sind **Veröffentlichungen: 15 Credits je Produktivveröffentlichung.** Mehr als etwa 10 im Monat sollten wir vermeiden (dann 150 Credits). Entwicklungsstände gehen auf eine Vorschau-Adresse (Branch-Deploy) oder lokal.
   - Wichtig: Die Credits teilt sich das ganze Konto mit deinen anderen Sites. **Bitte unter app.netlify.com → Nutzung die Credits im Auge behalten**, besonders in den ersten Wochen.
3. **Kachel-Dateien: zunächst auf Netlify**, als eigene statische Site `pv-dachplaner-daten` oder im selben Projekt. Wir starten mit einem **Pilotgebiet** (z. B. Stadt Bielefeld und Umgebung, einige hundert Kacheln, grob 50 bis 100 MB), nicht gleich mit ganz OWL (bis 1,3 GB). Maximale Deploy-Größe und Dateianzahl bei Netlify sind noch zu prüfen **[prüfen beim Pilot]**. Wächst der Bedarf, ist **Cloudflare R2** die Alternative (kostenloser Abruf), dazu bräuchten wir später ein Konto.
4. **Konten und Teilen (Supabase): zurückgestellt.** Du hast noch kein Konto. S7 wird erst vor Meilenstein M3 (Teamarbeit) ausgeführt. M1 (Kern) und M2 (PDF) laufen ohne Konten, Projekte liegen dann lokal auf dem Gerät.

**Quellen:** [Netlify Free Plan Limits 2026 (netli.fyi)](https://netli.fyi/blog/netlify-free-plan-limits-2026), [Netlify Free Tier 2026 (agentdeals.dev)](https://agentdeals.dev/vendor/netlify), [Cloudflare R2 Preise](https://developers.cloudflare.com/r2/pricing), [Supabase Free Tier Limits](https://www.itpathsolutions.com/supabase-free-tier-limits).

## S8 – Adresssuche: **eigener Adressindex aus amtlichen Daten**, 2026-10-09

Code: [`s8-adressen`](s8-adressen) (`build_index.py` baut den Index, `search_test.py` ist der Such-Prototyp mit Test).

**Fund:** Geobasis NRW stellt die **Gebäudereferenzen** als Open Data bereit (Hauskoordinaten, ganz NRW): `https://www.opengeodata.nrw.de/produkte/geobasis/lk/akt/gebref_txt/gebref_EPSG25832_ASCII.zip`, 97 MB (685 MB entpackt), Stand 01.07.2026, Koordinaten in EPSG:25832. Jede Zeile enthält Straße, Hausnummer, Zusatz, Gemeinde, Kreis und die Koordinate des Hauses. Enthalten sind nur Hauptgebäude mit Hausnummer (Garagen u. Ä. sind herausgefiltert), aktualisiert halbjährlich (Quelle: Format- und Produktbeschreibung der Bezirksregierung Köln).

| Frage | Ergebnis |
|---|---|
| Umfang | **4.509.543 Adressen** in NRW, davon **600.538 im Regierungsbezirk Detmold (OWL)**: Bielefeld 70.121, Gütersloh 105.889, Herford 75.716, Höxter 53.339, Lippe 107.192, Minden-Lübbecke 97.851, Paderborn 90.430 |
| Index für OWL | 70 Gemeindedateien, zusammen **14 MB roh, 5,1 MB gzip**; größte Datei Bielefeld 603 kB, Paderborn 309 kB, Gütersloh 228 kB. Die App lädt nur die Gemeinde, die der Nutzer eintippt. |
| Trefferquote Suchprototyp (200 zufällige OWL-Adressen aus 70 Gemeinden, je 6 Schreibweisen, Treffer = Koordinate innerhalb 15 m) | exakt 100 %, „Str.“ statt „Straße“ 100 %, ohne Umlaute/ß 100 %, klein ohne Satzzeichen 100 %, Hausnummer vor Straße 100 %, **ein Buchstabe fehlt (Tippfehler) 98 %** (3 von 196 nicht eindeutig, in der App würden dann Vorschläge erscheinen) |
| Passt der Punkt zum Gebäude? | Die Hauskoordinate liegt bei **78 %** der Adressen **innerhalb eines LoD2-Gebäudegrundrisses** (743 bzw. 866 Adressen in zwei Kacheln). Bei den übrigen 22 % liegt der Punkt außerhalb (nächste Gebäudeecke im Median 7–8 m, 90 % 16–26 m), meist am Eingang oder auf dem Grundstück. Die Kennungen der beiden Datensätze stimmen nicht überein, die Zuordnung läuft also räumlich. |

**Aussagekraft:** Der Trefferquoten-Test prüft Schreibweisen und Tippfehler an Adressen aus demselben Datenbestand. Er sagt nichts über Adressen, die in den Daten fehlen (Neubauten nach dem Stand 07/2026, Hausnummern ohne Hauptgebäude).

**Nicht getestet:** Externe Dienste (Nominatim, Photon, amtliche Geokodierung). Sie sind nach diesem Fund nicht mehr nötig. Der öffentliche Nominatim-Dienst erlaubt nach meiner Erinnerung keine Suche während des Tippens **[prüfen]**.

**Lizenz:** Für den Webdienst der Gebäudereferenzen ist dl-zero-de/2.0 angegeben. Für den ASCII-Download habe ich keine ausdrückliche Lizenzzeile gefunden (Zugriff ohne Beschränkung) **[prüfen auf der Datensatzseite bei open.nrw vor dem Rollout]**.

**Entscheidung**
1. **Eigener Adressindex** aus den Gebäudereferenzen, je Gemeinde eine kleine Datei (Weg wie bei den Dachflächen: vorab erzeugt, statisch bereitgestellt, 5 MB für ganz OWL, grob 35 MB für ganz NRW). Keine Abhängigkeit von externen Suchdiensten und keine Nutzungsgrenzen.
2. **Ablauf in der App:** Adresse eintippen → Treffer mit Vorschlägen → Karte springt zum Haus → die App wählt das nächstgelegene Gebäude (Punkt im Grundriss, sonst nächstes Gebäude bis etwa 30 m) und zeigt es zur Bestätigung. Der Nutzer kann **immer** per Antippen ein anderes Gebäude wählen.
3. **Fehlende Adressen:** Freie Eingabe „auf der Karte antippen“ bleibt als Fallback.
4. **Aktualisierung:** halbjährlich (neue Gebäudereferenzen und LoD2-Kacheln), als wiederholbarer Aufbereitungslauf.

## S5 – KI-Modell im Browser: **bestanden auf Desktop und iPhone** (Dauertest steht aus), 2026-10-09

Code und Testseite: [`s5-iphone-test`](s5-iphone-test), Testseite <https://pv-dachplaner-ki-test.netlify.app> (eigene Netlify-Site `pv-dachplaner-ki-test`).

**Modell:** MobileSAM (promptbare Segmentierung: Antippen → Maske), ONNX-Export von Acly (MIT), geladen von Hugging Face. Bild-Modell 28,2 MB, Masken-Modell 16,5 MB, zusammen **44,7 MB**; dazu die ONNX-Runtime (WASM, 25 MB). Die Originalprojekte (MobileSAM/SAM) stehen meines Wissens unter Apache-2.0 **[prüfen]**; die ONNX-Runtime ist MIT.

| Messung (headless Chromium, 4 virtuelle Kerne, Testumgebung) | Ergebnis |
|---|---|
| Modelle laden | 2,1 bis 2,5 s (schnelle Leitung, nicht repräsentativ) |
| Sitzung erstellen | 3,1 bis 4,4 s |
| Bild analysieren (einmal je Dach) | **10,4 s mit 1 Thread, 5,5 s mit 4 Threads** (Seite mit Cross-Origin-Isolation) |
| Maske je Antippen | 0,3 s (4 Threads), 0,5 bis 0,7 s (1 Thread) |
| Ergebnis gleich wie mit nativer Python-Runtime? | **Ja** (z. B. 1,32 m² gegen 1,29 m²; native Analyse: 1,0 s) |
| Fehler/Abstürze | keine |

**Wichtige Erkenntnisse**
- Der Encoder erwartet das Bild **vorab auf 1024 Pixel (längste Seite)** vergrößert; mit dem kleinen Originalausschnitt liefert er unbrauchbare, flächenfüllende Masken. Das ist in Skript und Seite berücksichtigt.
- Mehrere Threads brauchen **Cross-Origin-Isolation** (HTTP-Kopfzeilen `COOP: same-origin`, `COEP: require-corp`). Netlify kann das über `_headers`. Die Kopfzeilen schränken das Einbinden fremder Ressourcen ein (z. B. Kartenkacheln, Schriften); der WMS des Luftbilds bräuchte dann passende Freigaben. **Für die App-Karte ist das noch zu prüfen**, die KI-Seite kann sonst auch auf einer eigenen Unterseite laufen.
- Einmalige Last pro Gerät: ca. 70 MB (Modelle + Runtime). Mit Service Worker nur beim ersten Mal.

**iPhone (Messung von dir, 2026-10-09, aus dem Protokoll der Testseite):**

| Messung | iPhone |
|---|---|
| Masken-Modell laden | 16,5 MB in 1,0 s (WLAN) |
| Sitzungen erstellen | 2,6 s, **4 Threads** (Cross-Origin-Isolation funktioniert im Safari) |
| Bild analysieren (einmal je Dach) | **1,35 s und 1,51 s** (Beispiel A und B) |
| Maske je Antippen | **81 bis 98 ms** |
| Ergebnis | Entlüftung 0,52 m² (Sicherheit 0,91) und 0,60 m² (0,89); ein Antippen knapp neben dem Objekt ohne passende Maske (wie auf dem Desktop) |
| Fehler | keine gemeldet |

Das iPhone ist damit **drei- bis viermal schneller** als meine Testumgebung (Analyse 5,5 s) und liegt weit unter dem Kriterium von 10 s. Die Erkennung im Browser ist machbar, ein Serverdienst ist nicht nötig.

**Noch offen:** Dauertest (10 Durchläufe hintereinander ohne Absturz) und das genaue iPhone-Modell mit iOS-Version; beides steht nicht im Protokoll. Der Bericht (JSON) enthält Modell und Browser; bitte beim nächsten Mal mitsenden.

## S6 – Hinderniserkennung ohne Training: **Antippen funktioniert, Vollautomatik nicht**, 2026-10-09

Code: [`s6-erkennung`](s6-erkennung). Bewertung per **Sichtprüfung durch mich** an zwei Häusern in Bielefeld, keine unabhängige Beschriftung. Die Stichprobe ist klein; sie zeigt eine Richtung, keine Trefferquote.

| Ansatz | Ergebnis |
|---|---|
| **A: Antippen → Maske** | **Brauchbar.** Beispiel B ([Bild](s6-erkennung/evidence/antippen-beispiel-b.png)): Entlüftung (0,5 m²) und eine lange Dachrinnen-/Gratkante (1,3 m²) wurden sauber umrissen; die große helle Dachfläche (ca. 14 m²) wurde von einer der vier Masken getroffen, aber durch meine Größenbegrenzung (8 m²) verworfen. Zwei weitere Tippen waren knapp daneben und lieferten keine Maske am Objekt. Das Modell gibt je Antippen vier Masken (Teil bis Ganzes) mit Sicherheitswert; die App muss die passende wählen oder den Nutzer wählen lassen. |
| **B: Auffälligkeiten als Antippunkte** (Farbabweichung vom Dach, dann Maske) | **Schwach.** Beispiel A: 7 Auffälligkeiten, nach Filter 1 Kandidat (0,17 m²), das sichtbare Dachfenster wurde nicht erfasst. |
| **Raster aus Antippunkten** (jeder Meter) | **Ungeeignet.** Die Masken umfassen meist ganze Dachflächen; kleine Objekte werden zwischen den Punkten verfehlt; ein engeres Raster (0,3 m) bräuchte rund 1.500 Masken je Dach (ca. 100 s). |
| **C: eigenes Training** | **Nicht ausprobiert.** Braucht beschriftete Dächer (Schätzung einige hundert, siehe `SPIKES.md`). |

**Weitere Befunde**
- SAM liefert **Umrisse, keine Klassen**. Ob etwas ein Kamin oder ein Dachfenster ist, wählt der Nutzer (oder ein späteres trainiertes Modell).
- Das **LoD2-Dach passt nicht immer**: Beim Beispiel A deckt der LoD2-Umriss nur zwei der sichtbaren Dachflächen ab ([Bild](s6-erkennung/evidence/auffaelligkeiten-beispiel-a.png)). Die App braucht deshalb immer die Möglichkeit, Dachflächen anzupassen.
- Die Luftbilder sind True-Orthophotos mit gelegentlichen Rechenartefakten (schwarze/weiße Ränder an Hauswänden).

**Entscheidung (laut Vorgabe aus `SPIKES.md`: Ansatz A als Rückfall)**
1. **M5 beginnt mit „Antippen-Werkzeug“** (Ansatz A): Nutzer tippt auf ein Hindernis, die App schlägt eine Maske vor (mit Auswahl zwischen den vier Größenstufen), Nutzer wählt die Klasse (Kamin, Dachfenster, Gaube, …) und kann den Umriss nachziehen.
2. **Vollautomatische Vorschläge („Zu prüfen“-Liste) werden zurückgestellt**, bis beschriftete Beispiele vorliegen (Ansatz C). Der Rest des Produkts bleibt unverändert nutzbar.
3. Beschriftung kann schon vorher beginnen: Jede Korrektur in der App (mit Einwilligung) liefert später Trainingsdaten.

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
