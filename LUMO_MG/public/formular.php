<?php
/**
 * LUMO — Formularempfang für Stufe 1.
 *
 * Nimmt Reservierungsanfragen, Kontakt- und Feieranfragen entgegen und
 * schickt sie per E-Mail ans Haus. Bewusst ohne Framework und ohne
 * Datenbank, damit es auf jedem Webspace läuft — auch auf dem kleinsten
 * PHP-Paket.
 *
 * In Stufe 2 wird diese Datei durch die Astro-Route /api/reservierung
 * ersetzt. Feldnamen und Adressen bleiben dabei gleich, damit für den
 * Gast kein Unterschied entsteht.
 *
 * Einrichtung: formular.config.php aus formular.config.example.php
 * erstellen und die Adressen eintragen.
 */

declare(strict_types=1);

// --------------------------------------------------------------------
// Konfiguration
// --------------------------------------------------------------------

$configFile = __DIR__ . '/formular.config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    exit('Formular ist noch nicht eingerichtet.');
}
/** @var array{to:string,from:string,site:string,rateDir:string} $config */
$config = require $configFile;

const MIN_FILL_SECONDS = 3;      // schneller ausgefüllt = Bot
const MAX_FILL_SECONDS = 7200;   // Formular zu lange offen
const RATE_LIMIT_COUNT = 5;      // Anfragen …
const RATE_LIMIT_WINDOW = 3600;  // … pro Stunde und IP

// --------------------------------------------------------------------
// Hilfsfunktionen
// --------------------------------------------------------------------

function field(string $name, int $maxLength = 500): string
{
    $value = $_POST[$name] ?? '';
    if (!is_string($value)) {
        return '';
    }
    $value = trim($value);
    // Steuerzeichen raus — verhindert Header-Injection in Betreff und Absender
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    return mb_substr($value, 0, $maxLength);
}

function oneLine(string $value): string
{
    return str_replace(["\r", "\n"], ' ', $value);
}

function fail(string $message, int $status = 400): never
{
    http_response_code($status);
    header('Content-Type: text/plain; charset=utf-8');
    exit($message);
}

function redirect(string $url): never
{
    header('Location: ' . $url, true, 303);
    exit;
}

/** Einfache Ratenbegrenzung über Dateien. Speichert nur einen IP-Hash. */
function rateLimitExceeded(string $dir): bool
{
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return false; // Verzeichnis nicht anlegbar — lieber durchlassen als blockieren
    }
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unbekannt';
    $file = $dir . '/' . hash('sha256', $ip . date('Y-m-d-H')) . '.txt';
    $count = is_file($file) ? (int) file_get_contents($file) : 0;

    // Alte Dateien gelegentlich aufräumen
    if (random_int(1, 20) === 1) {
        foreach (glob($dir . '/*.txt') ?: [] as $old) {
            if (filemtime($old) < time() - RATE_LIMIT_WINDOW * 2) {
                @unlink($old);
            }
        }
    }

    if ($count >= RATE_LIMIT_COUNT) {
        return true;
    }
    file_put_contents($file, (string) ($count + 1), LOCK_EX);
    return false;
}

// --------------------------------------------------------------------
// Annahme
// --------------------------------------------------------------------

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('Methode nicht erlaubt.', 405);
}

$type = field('formular', 40);
$allowed = ['reservierung', 'kontakt', 'feiern'];
if (!in_array($type, $allowed, true)) {
    fail('Unbekanntes Formular.');
}

// Honeypot: unsichtbares Feld. Menschen füllen es nie aus.
if (field('website') !== '') {
    // Bots bekommen ein freundliches OK, damit sie es nicht erneut versuchen
    redirect($config['site'] . '/danke');
}

// Zeitfalle
$started = (int) field('gestartet', 20);
$elapsed = time() - $started;
if ($started <= 0 || $elapsed < MIN_FILL_SECONDS || $elapsed > MAX_FILL_SECONDS) {
    fail('Bitte sende das Formular erneut ab.', 422);
}

// Einwilligung
if (field('datenschutz') === '') {
    fail('Bitte bestätige die Datenschutzhinweise.', 422);
}

if (rateLimitExceeded($config['rateDir'])) {
    fail('Zu viele Anfragen. Bitte versuche es später erneut oder ruf uns an.', 429);
}

// --------------------------------------------------------------------
// Felder
// --------------------------------------------------------------------

$name = field('name', 120);
$email = field('email', 180);
$phone = field('telefon', 60);
$message = field('nachricht', 3000);

if ($name === '' || $email === '') {
    fail('Bitte gib Name und E-Mail-Adresse an.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('Die E-Mail-Adresse sieht nicht gültig aus.', 422);
}

$labels = [
    'reservierung' => 'Reservierungsanfrage',
    'kontakt' => 'Kontaktanfrage',
    'feiern' => 'Feieranfrage',
];

$lines = [];
$lines[] = 'Name: ' . $name;
$lines[] = 'E-Mail: ' . $email;
if ($phone !== '') {
    $lines[] = 'Telefon: ' . $phone;
}

if ($type === 'reservierung' || $type === 'feiern') {
    $date = field('datum', 20);
    $time = field('uhrzeit', 10);
    $people = field('personen', 10);
    $occasion = field('anlass', 120);

    if ($date !== '') {
        $lines[] = 'Datum: ' . $date;
    }
    if ($time !== '') {
        $lines[] = 'Uhrzeit: ' . $time;
    }
    if ($people !== '') {
        $lines[] = 'Personen: ' . $people;
    }
    if ($occasion !== '') {
        $lines[] = 'Anlass: ' . $occasion;
    }
}

if ($message !== '') {
    $lines[] = '';
    $lines[] = 'Nachricht:';
    $lines[] = $message;
}

$lines[] = '';
$lines[] = '--';
$lines[] = 'Gesendet über ' . $config['site'] . ' am ' . date('d.m.Y H:i');

$subject = '[LUMO] ' . $labels[$type] . ' — ' . oneLine($name);
$body = implode("\n", $lines);

$headers = [
    'From: LUMO Website <' . $config['from'] . '>',
    'Reply-To: ' . oneLine($name) . ' <' . oneLine($email) . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: LUMO-Formular',
];

$sent = @mail(
    $config['to'],
    '=?UTF-8?B?' . base64_encode($subject) . '?=',
    $body,
    implode("\r\n", $headers),
    '-f' . $config['from'],
);

if (!$sent) {
    fail('Die Nachricht konnte nicht gesendet werden. Bitte ruf uns an.', 500);
}

// Bestätigung an den Gast — bewusst schlicht und ohne Zusagecharakter
$guestBody = implode("\n", [
    'Hallo ' . $name . ',',
    '',
    'vielen Dank für deine ' . $labels[$type] . '. Wir haben sie erhalten und',
    'melden uns so schnell wie möglich bei dir.',
    '',
    'Bitte beachte: Diese E-Mail ist eine Eingangsbestätigung, noch keine',
    'verbindliche Zusage.',
    '',
    'Deine Angaben:',
    '',
    ...array_slice($lines, 0, -3),
    '',
    'Herzliche Grüße',
    'Dein LUMO-Team',
    $config['site'],
]);

@mail(
    $email,
    '=?UTF-8?B?' . base64_encode('Wir haben deine Anfrage erhalten — LUMO') . '?=',
    $guestBody,
    implode("\r\n", [
        'From: LUMO <' . $config['from'] . '>',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ]),
    '-f' . $config['from'],
);

redirect($config['site'] . '/danke');
