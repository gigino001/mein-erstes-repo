<?php
/**
 * Vorlage für die Konfiguration des Formularempfangs.
 *
 * Für den Betrieb als `formular.config.php` neben `formular.php` ablegen
 * und die Werte prüfen. Die echte Datei gehört NICHT ins Repository —
 * sie steht in .gitignore und wird von .htaccess vom Ausliefern
 * ausgeschlossen.
 */
return [
    /*
     * Empfänger je Formularart. Reservierungen landen dadurch im
     * eigenen Postfach und gehen an einem vollen Abend nicht zwischen
     * Werbung und Bewerbungen unter.
     *
     * Statt eines Feldes ist auch eine einzelne Adresse als Zeichenkette
     * erlaubt — dann geht alles dorthin. Der Schlüssel '*' dient als
     * Auffangwert für Arten, die hier nicht aufgeführt sind.
     */
    'to' => [
        'reservierung' => 'reservierung@lumo-mg.de',
        'kontakt' => 'info@lumo-mg.de',
        'feiern' => 'info@lumo-mg.de',
        '*' => 'info@lumo-mg.de',
    ],

    /*
     * Absender der Bestätigungsmails, ebenfalls je Formularart.
     *
     * Bewusst dieselbe Adresse wie der Empfänger und ausdrücklich kein
     * noreply@: Antwortet ein Gast auf die Bestätigung — etwa um eine
     * Uhrzeit zu verschieben — soll die Antwort dort ankommen, wo die
     * Anfrage bearbeitet wird.
     *
     * Die Adresse MUSS zur eigenen Domain gehören. Eine fremde Adresse
     * als Absender lässt SPF scheitern, und die Mail landet im Spam.
     */
    'from' => [
        'reservierung' => 'reservierung@lumo-mg.de',
        'kontakt' => 'info@lumo-mg.de',
        'feiern' => 'info@lumo-mg.de',
        '*' => 'info@lumo-mg.de',
    ],

    // Ohne abschließenden Schrägstrich
    'site' => 'https://lumo-mg.de',

    /*
     * Verzeichnis für die Ratenbegrenzung. Liegt eine Ebene über dem
     * Webverzeichnis, damit es von außen nicht erreichbar ist. Falls der
     * Hoster das nicht zulässt, greift ersatzweise die Sperre in
     * .htaccess.
     */
    'rateDir' => __DIR__ . '/../.formular-rate',
];
