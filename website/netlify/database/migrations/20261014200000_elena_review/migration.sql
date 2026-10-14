-- Von Claudia direkt übermittelte (bereits freigegebene) Kundinnenstimme,
-- ohne den Mail-Freischalten-Workflow für echte Formular-Einreichungen.

INSERT INTO "Review" ("id", "customerName", "rating", "text", "status", "token", "createdAt", "approvedAt")
VALUES (
  'c4g77wx8zhydrw1cafygk23ta',
  'Elena',
  5,
  'Claudia, Vielen lieben Dank für die schönen Wimpern. Ich bin absolut begeistert! Danke!',
  'approved',
  '5e7f5e7ceaa154580918652fa4c4bfc943825bd28f8201c0',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
