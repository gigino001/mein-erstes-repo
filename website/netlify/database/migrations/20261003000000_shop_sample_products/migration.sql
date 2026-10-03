-- Beispiel-Produkte für den Shop, damit die Optik live angeschaut werden kann.
-- Namen/Preise/Beschreibungen sind Platzhalter und sollten im Admin-Bereich
-- (/admin/produkte) durch echte Daten ersetzt werden, bevor echte Bestellungen
-- erwünscht sind.

INSERT INTO "Product" ("id", "name", "description", "priceCents", "imageUrl", "active", "sortOrder") VALUES
    ('product-1', 'Wimpern-Reinigungsshampoo', 'Sanftes Reinigungsshampoo speziell für Wimpernverlängerungen — hält deine Extensions länger schön.', 1290, NULL, true, 1),
    ('product-2', 'Wimpernbürste', 'Kleine Bürste zum täglichen Durchkämmen deiner Wimpernverlängerung.', 490, NULL, true, 2),
    ('product-3', 'Wimpernkleber (Reiseset)', 'Kleines Reiseset für unterwegs — bitte vor der ersten Verwendung Rücksprache mit Claudia halten.', 1490, NULL, true, 3),
    ('product-4', 'Wimpern-Fächer Set', 'Vorgefächerte Wimpern für zu Hause als kleines Nachfüll-Set.', 2490, NULL, true, 4)
ON CONFLICT ("id") DO NOTHING;
