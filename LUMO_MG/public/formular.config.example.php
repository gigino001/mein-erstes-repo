<?php
/**
 * Vorlage für die Konfiguration des Formularempfangs.
 *
 * Für den Betrieb als `formular.config.php` neben `formular.php` ablegen
 * und die Werte prüfen. Die echte Datei gehört NICHT ins Repository —
 * sie steht in .gitignore und wird von .htaccess vom Ausliefern
 * ausgeschlossen.
 *
 * Alles läuft über eine einzige Adresse: info@lumo-mg.de.
 */
return [
    // Wohin die Anfragen gehen — Reservierungen, Kontakt und Feiern.
    'to' => 'info@lumo-mg.de',

    /*
     * Absender der Bestätigungsmails.
     *
     * Bewusst dieselbe Adresse und ausdrücklich kein noreply@:
     * Antwortet ein Gast auf die Bestätigung, soll die Antwort im
     * Postfach ankommen und nicht ins Leere laufen.
     *
     * Die Adresse MUSS zur eigenen Domain gehören. Eine fremde Adresse
     * als Absender lässt SPF scheitern, und die Mail landet im Spam.
     */
    'from' => 'info@lumo-mg.de',

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
