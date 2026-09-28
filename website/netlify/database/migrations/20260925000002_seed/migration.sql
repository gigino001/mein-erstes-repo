-- Grunddaten für den Netlify-Preview, entspricht prisma/seed.ts.

INSERT INTO "Staff" ("id", "name", "active") VALUES
    ('staff-claudia', 'Claudia Gajda', true)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Availability" ("id", "staffId", "weekday", "startMinute", "endMinute") VALUES
    ('avail-staff-claudia-1', 'staff-claudia', 1, 600, 1200),
    ('avail-staff-claudia-2', 'staff-claudia', 2, 600, 1200),
    ('avail-staff-claudia-3', 'staff-claudia', 3, 600, 1200),
    ('avail-staff-claudia-4', 'staff-claudia', 4, 600, 1200),
    ('avail-staff-claudia-5', 'staff-claudia', 5, 600, 960)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Service" ("id", "category", "name", "description", "durationMinutes", "priceCents", "sortOrder") VALUES
    ('service-1', 'neumodellage', 'Neumodellage 1:1 (Classic)', NULL, 90, 8000, 1),
    ('service-2', 'neumodellage', 'Neumodellage Light Volumen', NULL, 90, 9000, 2),
    ('service-3', 'neumodellage', 'Neumodellage Mega Volumen', NULL, 90, 10000, 3),
    ('service-4', 'neumodellage', 'Bloom Eyes Neumodellage', 'Wispy, Wet mit Farbe deiner Wahl. Für den extravaganten natürlichen Look.', 120, 9500, 4),
    ('service-10', 'auffuellen', 'Auffülltermin 1:1 (2-3 Wochen)', NULL, 60, 4000, 10),
    ('service-11', 'auffuellen', 'Auffülltermin 1:1 (3-4 Wochen)', NULL, 60, 5000, 11),
    ('service-12', 'auffuellen', 'Auffülltermin Light Volumen (2-3 Wochen)', NULL, 60, 5000, 12),
    ('service-13', 'auffuellen', 'Auffülltermin Light Volumen (3-4 Wochen)', NULL, 60, 6000, 13),
    ('service-14', 'auffuellen', 'Auffülltermin Mega Volumen (2-3 Wochen)', NULL, 60, 6000, 14),
    ('service-15', 'auffuellen', 'Auffülltermin Mega Volumen (3-4 Wochen)', NULL, 60, 7000, 15),
    ('service-16', 'auffuellen', 'Bloom Eyes Auffüllen (2-3 Wochen)', NULL, 60, 5500, 16),
    ('service-17', 'auffuellen', 'Bloom Eyes Auffüllen (3-4 Wochen)', NULL, 60, 6500, 17),
    ('service-20', 'sonstiges', 'Wimpern entfernen', NULL, 30, 1000, 20),
    ('service-21', 'sonstiges', 'Modellarbeit', 'Du hast eine Anzeige gesehen, dass Models gesucht werden? Buch dich gerne dafür ein.', 120, 5000, 21)
ON CONFLICT ("id") DO NOTHING;
