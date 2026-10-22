-- Token für die Selbststornierungs-Links in der Bestätigungsmail. Bestehende
-- Zeilen werden mit einem zufälligen Wert befüllt (nur eingebaute
-- Postgres-Funktionen, keine Extension nötig), dann erst NOT NULL + UNIQUE.

ALTER TABLE "Appointment" ADD COLUMN "cancelToken" TEXT;

UPDATE "Appointment"
SET "cancelToken" = md5(random()::text || clock_timestamp()::text || "id")
WHERE "cancelToken" IS NULL;

ALTER TABLE "Appointment" ALTER COLUMN "cancelToken" SET NOT NULL;

CREATE UNIQUE INDEX "Appointment_cancelToken_key" ON "Appointment"("cancelToken");
