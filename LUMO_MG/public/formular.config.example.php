<?php
/**
 * Vorlage. Für den Betrieb als formular.config.php neben formular.php
 * ablegen und die Werte eintragen. Die echte Datei gehört NICHT ins
 * Repository — sie steht in .gitignore.
 */
return [
    // Wohin die Anfragen gehen
    'to' => 'reservierung@lumo-mg.de',

    // Absender. Muss eine Adresse der eigenen Domain sein, sonst
    // scheitert SPF und die Mail landet im Spam.
    'from' => 'noreply@lumo-mg.de',

    // Ohne abschließenden Schrägstrich
    'site' => 'https://lumo-mg.de',

    // Verzeichnis für die Ratenbegrenzung. Sollte außerhalb des
    // öffentlichen Verzeichnisses liegen, wenn der Hoster das erlaubt.
    'rateDir' => __DIR__ . '/../.formular-rate',
];
