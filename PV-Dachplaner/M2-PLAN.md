# PV-Dachplaner – Detailplan Meilenstein M2 (PDF, Verstringung, CRM-Export)

Stand: 2026-10-12 · Gehört zu [`PLAN.md`](PLAN.md) (Kap. 14) und folgt auf [`M1-PLAN.md`](M1-PLAN.md) · Status: **Stand 2026-10-12: E1 (PDF), E2 Stufe A (grafische Verstringung) und E3 Dateiexport sind gebaut und getestet; offen sind E2 Stufe B (elektrische Prüfung) und die direkte CRM-Übertragung**

Auslöser: Wunsch des Auftraggebers, am Ende der Erstellung ein **PDF mit allen wichtigen Daten** zu erzeugen, inklusive **Dachbild mit Modulplatzierung** und der **Verstringung der PV-Module**, dazu eine **Exportmöglichkeit für das CRM**.

Aussagen mit **[prüfen]** sind nicht belegt. Zeitangaben sind **Schätzungen**. Alles, was Datenblattwerte oder Normen betrifft, braucht deine Vorgaben (siehe Kap. 8); ich erfinde keine Kennwerte.

---

## 0. Entscheidungen des Auftraggebers (2026-10-12)

- **CRM:** erst **Dateiexport** (ZIP mit PDF, JSON, CSV), direkte Anbindung später, sobald das CRM feststeht.
- **Verstringung:** erst **grafisch (Stufe A)**; die elektrische Prüfung (Stufe B) folgt, sobald Modul- und Wechselrichterdaten vorliegen.
- **Reihenfolge:** PDF und Verstringung **vor** den Gebäudedaten (Pakete 10 und 11).
- Zusatzwunsch: Modulansicht **ausblendbar**, um Hindernisse besser zu markieren (fertig, Schalter „Module“).

## 0a. Umsetzungsstand

| Teil | Stand |
|---|---|
| E1 PDF-Export | **fertig**: 5 Seiten (Deckblatt mit Kennzahlen und Übersichtsbild, Dachbild mit Modulen, Tabellen mit Hindernissen, Annahmen und Hinweisen, Stringplan, String-Tabelle). Das Luftbild wird in EPSG:25832 mit 5 cm je Pixel geladen und im PDF mit **Vektor-Überlagerung** (Dachflächen, Module, Hindernisse, Strings), **Maßstab** und **Nordpfeil** (mit Meridiankonvergenz) versehen. Test prüft Seitentext mit `pdftotext`, Seitenzahl und dass die Zahlen mit der App übereinstimmen. |
| E2 Stufe A Verstringung | **fertig**: Eingabe „Module je String (höchstens)“, Option „gleich lange Strings“ (45 Module bei höchstens 14: 12, 11, 11, 11), Schlangenlinie entlang der Modulreihen von der Traufe zum First, Dachflächen werden nie gemischt. Darstellung farbig auf der Karte und im PDF mit Ziffern, Startkreis und Verbindungslinie. Keine elektrische Prüfung. |
| E3 Dateiexport | **fertig**: ZIP (PDF, `projekt.json`, `projekt.csv`, `daecher.csv`, Liesmich), einzelne JSON/CSV, Kurztext für die Zwischenablage; CSV mit Semikolon, Dezimalkomma, UTF-8 mit BOM. Auf dem iPhone über das Teilen-Menü versendbar, wo der Browser es erlaubt. |
| E2 Stufe B | offen: braucht Datenblätter (Modul, Wechselrichter) |
| E3 direkte Übertragung | offen: braucht die Angabe, welches CRM |

## 1. Was dazukommt

| Teil | Kurz | Abhängigkeit |
|---|---|---|
| **E1 PDF-Export** | Ein PDF mit Projektdaten, Dachbild mit Modulbelegung, Tabellen, Annahmen, Hinweisen | M1 (läuft nach Paket 7/8 schon sinnvoll) |
| **E2 Verstringung** | Module je Dachfläche zu Strings zusammenfassen, im Bild und im PDF darstellen, elektrisch prüfen | Modul- und Wechselrichterdaten von dir |
| **E3 CRM-Export** | Projekt als Datei (JSON, CSV, Paket mit PDF) für das CRM; später direkte Übertragung | Welches CRM? |

**Reihenfolge-Vorschlag:** E1 zuerst (liefert sofort Nutzen, ohne offene Fachfragen), dann E3 als Dateiexport, dann E2. Die Verstringung hängt an Daten und Entscheidungen, die ich nicht raten kann.

## 2. E1 – PDF-Export

**Auslösung:** Button „PDF erstellen“ im Editor und in der Projektliste. Erzeugt wird **im Browser** (kein Server), Dateiname `PV-Planung_<Straße>_<Datum>.pdf`; auf dem iPhone über das Teilen-Menü speicherbar oder versendbar.

### 2.1 Inhalt (Vorschlag, A4 hochkant)

| Seite | Inhalt |
|---|---|
| 1 Deckblatt und Ergebnis | Titel, Projektname, Kunde (Name, Notiz), Adresse, Datum, Bearbeiter; große Kennzahlen: **Module, Leistung (kWp), nutzbare Dachfläche, Anzahl Dachflächen**; kleine Übersichtskarte mit dem Haus |
| 2 Dachbild | **Luftbild des Hauses** mit Dachflächen, **Modulen** (an der Dachebene ausgerichtet), Hindernissen, **Maßstab** und **Nordpfeil**, Beschriftung D1, D2 …; Quellenangabe und Bildflugdatum |
| 3 Je Dachfläche | Tabelle: Name, Neigung, Ausrichtung (Grad und Himmelsrichtung), Dachfläche (Schrägfläche), Abzüge (Rand, Hindernisse), nutzbare Fläche, Module hochkant/quer, gewählte Belegung, Leistung |
| 4 Hindernisse und Annahmen | Liste der Hindernisse (Art, Maße, abgezogen ja/nein, Abstand); Annahmen: Modulmaße 1,15 × 1,78 m, 460 Wp, Fuge in den Maßen, Randabstand, Ausrichtung; Datenquellen (NRW-Luftbild, ggf. 3D-Gebäudemodell mit Stand); **Haftungshinweis** (Planungshilfe, Aufmaß und Statik vom Installateur zu prüfen, Bild kann veraltet sein) |
| 5 (E2) Stringplan | Siehe Kap. 3: Module farbig nach String, String-Tabelle, Prüfwerte |

Kein Firmen-Branding (Entscheidung aus M1), aber ein einfaches, sauberes Layout. Bearbeiter: Eingabe in den Einstellungen (ohne Konten).

### 2.2 Technik

- **Bibliothek:** `pdf-lib` (reines Browser-JavaScript, MIT) oder `jsPDF` **[prüfen, Größe und Umlaute]**. Standardschriften (Helvetica) beherrschen Umlaute und ß; eingebettete Schrift nur, wenn nötig.
- **Dachbild:** Eine **versteckte Kartenansicht** (gleiche Ebenen wie im Editor) wird auf das Haus zugeschnitten (Rahmen um alle Dachflächen plus Rand), in hoher Auflösung gerendert (z. B. 1800 × 1300 px), als JPEG in das PDF eingebettet. Maßstab und Nordpfeil werden im PDF gezeichnet (Maßstab aus der Auflösung in EPSG:25832 berechnet, nicht aus der Bildschirmgröße).
- **Qualität des Bildes:** Das Luftbild hat 10 cm je Pixel; ein 20-m-Dach füllt bei Zoomstufe 19 rund 220 Pixel. Das PDF vergrößert nur darstellerisch; es entsteht nie mehr Detail als in den Daten. Das steht im Plan, damit niemand ein „Satellitenfoto in 4K“ erwartet.
- **Dauer:** ca. 2 bis 6 s auf dem iPhone **[prüfen]**, mit Fortschrittsanzeige.
- **Dateigröße:** Ziel unter 3 MB.
- **Tests:** PDF wird in einem Browsertest erzeugt, Seitenzahl und Text (Kennzahlen) per PDF-Textauszug geprüft, Seiten als Bild gerendert und von mir angesehen; Zahlen im PDF müssen exakt den Zahlen der App entsprechen.

### 2.3 Aufwand

ca. **4 bis 5 Arbeitstage** (Layout, Kartenbild, Maßstab, Tabellen, Tests, Feinschliff am iPhone).

## 3. E2 – Verstringung der PV-Module

„Verstringung“ meint hier die Aufteilung der Module in **Strings** (Reihenschaltungen), die an einen Wechselrichter-Eingang (MPPT) angeschlossen werden. Es gibt zwei Ausbaustufen; welche du meinst, klären wir in Kap. 8.

### 3.1 Stufe A – grafische Verstringung (ohne Elektrik)

Der Nutzer legt Strings fest oder lässt sie vorschlagen: Module einer Dachfläche werden in Gruppen **gleicher Länge** eingeteilt, entlang der Modulreihen nummeriert und im Plan **farbig und mit Nummern (S1-1, S1-2 …)** dargestellt. Die Stringlänge ist eine Eingabe (z. B. 14 Module je String). Keine Spannungsprüfung. Nutzen: Montage- und Kabelplan.

**Aufwand:** ca. 3 bis 4 Arbeitstage.

### 3.2 Stufe B – elektrische Auslegung mit Prüfung

Zusätzlich werden **Modul- und Wechselrichterdaten** verwendet und die Strings gegen deren Grenzen geprüft.

**Benötigte Eingaben (Datenblätter):**
- Modul: Pmax (460 Wp), Voc, Vmpp, Isc, Impp, Temperaturkoeffizient von Voc und Pmax (Prozent je Kelvin), maximale Systemspannung.
- Wechselrichter: maximale DC-Eingangsspannung, MPPT-Spannungsbereich, Startspannung, maximaler Eingangsstrom und maximaler Kurzschlussstrom je MPPT, Anzahl MPPTs und Strings je MPPT, AC-Nennleistung.
- Standortannahmen: tiefste Zelltemperatur (üblich −10 °C für Deutschland), höchste Zelltemperatur (üblich 70 °C) **[prüfen, mit Installateur festlegen]**.

**Berechnung:**
- Maximale Stringlänge = ⌊max. DC-Spannung ÷ Voc bei tiefster Temperatur⌋.
- Minimale Stringlänge = ⌈untere MPPT-Spannung ÷ Vmpp bei höchster Temperatur⌉.
- Ströme: String-Impp und Isc gegen die Grenzen je Eingang (bei parallelen Strings addieren).
- Verhältnis DC-Leistung zu AC-Leistung (Überdimensionierung) als Information.

**Zuordnung (Vorschlag der App, Nutzer kann ändern):**
- Dachflächen mit unterschiedlicher Ausrichtung oder Neigung dürfen **nicht in denselben String** und **nicht an denselben MPPT**; die App ordnet sie getrennten MPPTs zu und warnt sonst.
- Strings werden aus **benachbarten Modulen** gebildet (Reihen entlang der Traufe), gleiche Länge je MPPT.
- Reste (z. B. 45 Module bei Stringlänge 14 = 3 × 14 + 3) werden gemeldet und Alternativen angeboten (z. B. 15 + 15 + 15).
- Verschattung wird in M2 **nicht** berechnet; Hinweis im PDF.

**Darstellung:** Plan mit farbigen Strings, Nummerierung, Verbindungslinie in Reihenfolge, Tabelle je String (Länge, Voc kalt, Vmpp heiß, Strom, MPPT), Gesamtübersicht je Wechselrichter.

**Aufwand:** ca. 6 bis 8 Arbeitstage nach Vorliegen der Daten (Datenmodell, Berechnung mit Tests, Zuordnung, Darstellung, PDF-Seite).

### 3.3 Sicherheit und Haftung

Die Verstringung ist eine **Planungshilfe**. Normative Anforderungen (z. B. VDE-Regeln, Leitungsquerschnitte, Schutzeinrichtungen) und die endgültige Auslegung bleiben beim Elektrofachbetrieb. Das PDF trägt diesen Hinweis. Die Berechnungsformeln werden mit Handrechnungen aus den Datenblättern getestet, die du uns gibst.

## 4. E3 – CRM-Export

**Ohne Konten und Server** ist der sichere Weg ein **Dateiexport**, den dein CRM einlesen oder an den Datensatz anhängen kann:

| Format | Inhalt | Nutzen |
|---|---|---|
| **Paket (ZIP)** | PDF, Projekt als JSON, Kennzahlen als CSV | alles auf einmal, zum Anhängen im CRM oder per Mail |
| **JSON** | vollständiges Projekt (Geometrie, Dachflächen, Hindernisse, Ergebnis, Strings) | Wiederöffnen in der App, technische Weiterverarbeitung |
| **CSV** | eine Zeile je Projekt (Kunde, Adresse, Module, kWp, Fläche, Dachflächenzahl, Datum) und eine je Dachfläche | Import in Tabellen und viele CRMs |
| **Zwischenablage** | Kurzzusammenfassung als Text | schnell in ein Notizfeld |

**Direkte Übertragung ins CRM** (später): Fast jedes CRM hat eine Schnittstelle. Zugangsschlüssel dürfen aber **nicht im Browser** stehen. Möglichkeiten **[prüfen, je nach CRM]**: (a) kleine serverlose Funktion als Vermittler (Netlify-Funktion; braucht Credits und Pflege), (b) ein Webhook über einen Dienst wie Zapier oder Make, (c) Import per E-Mail-Adresse des CRM (PDF als Anhang). Die Wahl hängt vom CRM ab (Kap. 8).

**Felder für das CRM (Vorschlag):** Kundenname, Adresse (Text und Koordinate), Projektname, Datum, Bearbeiter, Anzahl Dachflächen, Module, Leistung kWp, nutzbare Fläche, Ausrichtung(en), Neigung(en), Notiz, Verweis auf das PDF.

**Aufwand:** Dateiexport ca. **2 Arbeitstage**; direkte Anbindung **2 bis 5 Arbeitstage** je nach CRM und gewähltem Weg.

## 5. Einordnung im Gesamtplan

| Meilenstein | Inhalt |
|---|---|
| M1 | wie geplant (Karte bis Gebäudedaten), **Pakete 1 bis 9 sind fertig** |
| **M2a** | **E1 PDF-Export** (ohne Stringplan) und **E3 Dateiexport** |
| **M2b** | **E2 Verstringung** (Stufe A oder B) mit Seite im PDF |
| M2c | **E3 direkte CRM-Übertragung** (nach Wahl des Weges) |
| M3 | Konten, Teilen (unverändert; Supabase-Konto nötig) |

Die offenen M1-Pakete (10, 11 Gebäudedaten; 12 Politur; 13 Abnahme) laufen weiter. Ich schlage vor, **E1 vor Paket 10 und 11 zu bauen**, weil das PDF mit der manuellen Erfassung schon sofort funktioniert und du es früh am Kunden testen kannst. Die Gebäudedaten lassen sich danach ergänzen.

## 6. Qualitätsanforderungen

- Zahlen im PDF stimmen **exakt** mit den Zahlen in der App überein (automatischer Test).
- Das PDF enthält nur Daten, die der Nutzer eingegeben oder berechnet hat; fehlende Angaben stehen als „fehlt“ im PDF, nie als erfundener Wert.
- Datenschutz: PDF und Export werden lokal erzeugt; nichts verlässt das Gerät, bis der Nutzer es selbst versendet.

## 7. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Kartenbild im PDF unscharf oder verzerrt | Rendern in der Auflösung der Quelldaten, Maßstab aus EPSG:25832, Test mit Referenzmaß (Stadionkreis, S1) |
| PDF-Erzeugung auf dem iPhone langsam oder speicherhungrig | Messung früh, Bildgröße begrenzen, Fortschrittsanzeige |
| Verstringung wird als verbindliche Elektroplanung missverstanden | Hinweis im PDF und in der App; Berechnung transparent mit Formeln und Eingabewerten |
| Datenblattwerte falsch oder veraltet | Eingabe durch den Nutzer, Anzeige im PDF, keine eingebauten „Standardmodule“ ohne Quelle |
| CRM-Schnittstelle ändert sich | Dateiexport als stabile Grundlage, direkte Anbindung als dünne, austauschbare Schicht |

## 8. Offene Fragen an dich

1. **CRM:** Welches nutzt ihr (z. B. HubSpot, Pipedrive, Salesforce, Zoho, ein Branchen-CRM, anderes)? Kann es CSV importieren und/oder hat es eine Schnittstelle? Reicht zunächst ein Dateiexport?
2. **Verstringung, Umfang:** Reicht zunächst die **grafische Verstringung** (Stufe A), oder soll gleich die **elektrische Auslegung** mit Spannungs- und Stromprüfung (Stufe B) dabei sein?
3. **Wechselrichter und Modul:** Welche Wechselrichter-Hersteller und -Typen nutzt ihr überwiegend, und welches Modul (Hersteller, Typ, 460 Wp)? Für Stufe B brauche ich die **Datenblätter** (oder die Werte, siehe Kap. 3.2).
4. **Verstringungsregeln im Betrieb:** Gibt es feste Vorgaben (z. B. Mindest-/Höchstzahl Module je String, getrennte Strings je Dachfläche, maximal zwei Strings je MPPT)? Wer prüft das Ergebnis?
5. **PDF-Inhalt:** Passt die Seitenliste aus Kap. 2.1? Fehlt etwas (z. B. Ertragsschätzung, Fotos, Preis, Unterschriftsfeld, Hinweise für den Netzbetreiber)? Soll auf dem Dachbild die **Modulnummerierung** stehen (in M1 hattest du „nein“ gesagt; bei der Verstringung wären Stringnummern sinnvoll)?
6. **Sprache und Ton:** Das PDF geht an Kunden oder an Installateure oder beide? (Beeinflusst Detailtiefe und Hinweise.)
7. **Reihenfolge:** Einverstanden, dass E1 (PDF) **vor** den Gebäudedaten (Pakete 10, 11) gebaut wird?

## Stand Verstringung Stufe B (v0.10.0)

- **Gleich lange Strings je Dachfläche**, mathematisch blockiert: Länge muss die Modulzahl teilen (34 mit 12 oder 11 wird abgelehnt, mit Begründung); Auswahl passender Längen, Zwei-Gruppen-Vorschläge (z. B. 2 × 12 + 1 × 10), nahe Modulzahlen.
- **Geräte-Datenbank** (`app/src/lib/geraete.ts`): Modul Jolywood JW-HD96N-R2 460 W (Datenblatt), Sungrow SH5.0RT–SH25T, Sigen Hybrid TP2 / Energy Controller. Aus Modul + Wechselrichter wird die zulässige Stringlänge berechnet (−10 °C / +70 °C, Rechenweg sichtbar). Annahme: Vmpp-Temperaturgang ≈ Pmax-Koeffizient. AIKO ohne Datenblattwerte → keine Grenzen.
- **Strings von Hand**: Werkzeug „Strings“, Module der Reihe nach antippen (1, 2, 3 …), Modul im aktiven String erneut antippen = entfernen, Modul eines anderen Strings antippen = verschieben, MPPT-Eingang je String, „zurück zu automatisch“.
- **Prüfungen**: Modul ohne String, doppelte Module, Bereich, veraltete Belegung (Modulzahl geändert), verschieden lange Strings je MPPT (projektweit), MPPT-Nummer/Strings je Eingang/Kurzschlussstrom je Wechselrichter.
- **Offen**: Datenblattwerte SH6.0/8.0RT (Original), Sigen-Ströme je Modell, Datenbank selbst erweitern (Eingabemaske/Import), Module einzeln sperren, PDF-Spalte MPPT.
