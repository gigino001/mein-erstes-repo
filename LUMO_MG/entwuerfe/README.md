# Gestaltungsentwürfe

Drei Fassungen derselben Startseite, in dieser Reihenfolge entstanden.
Zum Ansehen genügt ein Doppelklick — kein Server nötig.

| Datei | Fassung | Status |
|---|---|---|
| [`daylight.html`](daylight.html) | Hell, das Wandbild liegt als feste Ebene hinter der gesamten Seite | **gewählt** |
| [`sunset.html`](sunset.html) | Dunkel, das Wandbild nur im Hero | verworfen |
| [`dunkel.html`](dunkel.html) | Nachtschwarz mit Gold, ohne Wandbild | verworfen |

## Was daran Platzhalter ist

Bildflächen, Preise, Öffnungszeiten, Events und Kapazitäten sind erfunden
und stehen nur da, um Rhythmus und Wirkung zu zeigen. Echt sind Adresse,
Eröffnungsdatum, Angebotsschwerpunkte und das Wandbild.

Die Preise in der Speisekarte **müssen** vor dem Livegang durch die
echten ersetzt werden.

## Unterschied zur veröffentlichten Fassung

In den Artifact-Versionen ist `assets/wandbild.jpg` als Base64-Blob in die
Datei eingebettet, weil eine veröffentlichte Seite in sich geschlossen sein
muss. Hier im Projekt referenziert `daylight.html` das Bild stattdessen über
`../assets/wandbild.jpg`. Inhaltlich identisch, aber 48 statt 276 KB — und
das Bild liegt nur einmal im Repository.

## Wie es weitergeht

Diese Dateien sind Entwürfe, kein Produktionscode. Für Stufe 1 wird
`daylight.html` in Astro-Komponenten zerlegt; Farb- und Schriftwerte
wandern dabei in Design-Tokens. Die Entwürfe bleiben als Referenz liegen.
