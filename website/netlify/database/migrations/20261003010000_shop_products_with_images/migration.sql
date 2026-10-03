-- Vier neue Beispiel-Produkte mit generierten Bildern (Shampoo, Kleber,
-- Serum, Pinzette). Ersetzen die bildlosen Platzhalter aus der vorigen
-- Migration für Shampoo und Kleber (deaktiviert statt gelöscht, damit die
-- Bestellhistorie nicht betroffen ist, falls dazu schon etwas existiert).

UPDATE "Product" SET "active" = false WHERE "id" IN ('product-1', 'product-3');

INSERT INTO "Product" ("id", "name", "description", "priceCents", "imageUrl", "active", "sortOrder") VALUES
    ('product-5', 'Wimpern-Shampoo', 'Mildes Reinigungsshampoo, speziell abgestimmt auf Wimpernverlängerungen — hält Kleber und Wimpern sauber, ohne die Verlängerung zu lösen.', 1390, '/images/shop/wimpern-shampoo.jpg', true, 1),
    ('product-6', 'Wimpernkleber', 'Hochwertiger Wimpernkleber für die Nachpflege zuhause. Bitte nur nach Rücksprache mit Claudia verwenden, da die Anwendung Erfahrung erfordert.', 1690, '/images/shop/wimpern-kleber.jpg', true, 2),
    ('product-7', 'Wimpern-Serum', 'Pflegeserum für gesundes Wimpernwachstum — täglich am Wimpernkranz aufgetragen, unterstützt kräftige, gesunde Naturwimpern unter der Verlängerung.', 2490, '/images/shop/wimpern-serum.jpg', true, 3),
    ('product-8', 'Wimpern-Pinzette', 'Elegante Edelstahl-Pinzette für die präzise Wimpernpflege zuhause, z. B. zum sanften Trennen einzelner Wimpern.', 990, '/images/shop/wimpern-pinzette.jpg', true, 4)
ON CONFLICT ("id") DO NOTHING;
