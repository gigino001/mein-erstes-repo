-- Fügt Felder für die Stripe-Anzahlung bei Terminbuchungen hinzu.

ALTER TABLE "Appointment" ADD COLUMN "depositAmountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Appointment" ADD COLUMN "stripePaymentIntentId" TEXT;
