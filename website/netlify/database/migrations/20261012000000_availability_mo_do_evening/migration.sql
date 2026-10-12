-- Online-Buchung ist Montag bis Donnerstag nur noch von 16 bis 20 Uhr
-- möglich (statt wie bisher 10 bis 20 Uhr). Freitag bleibt unverändert. Die
-- angezeigten Öffnungszeiten (business.ts, Kontaktseite, Schema.org) sind
-- davon bewusst nicht betroffen und bleiben unverändert.

UPDATE "Availability"
SET "startMinute" = 960
WHERE "staffId" = 'staff-claudia' AND "weekday" IN (1, 2, 3, 4);
