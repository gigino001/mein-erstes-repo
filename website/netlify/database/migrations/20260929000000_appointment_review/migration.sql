-- Fügt ein Feld hinzu, das verfolgt, ob die Bewertungs-Anfrage-Mail (2 Tage
-- nach dem Termin) bereits verschickt wurde — verhindert doppelten Versand.

ALTER TABLE "Appointment" ADD COLUMN "reviewRequestSentAt" TIMESTAMP(3);
