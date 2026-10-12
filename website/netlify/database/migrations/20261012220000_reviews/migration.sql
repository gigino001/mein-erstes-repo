-- Speichert abgegebene Bewertungen. Jede neue Bewertung landet hier als
-- "pending"; die Benachrichtigungs-Mail an die Inhaberin enthält
-- Freischalten-/Ablehnen-Links mit dem "token" dieser Zeile. Erst "approved"
-- Bewertungen werden auf der Website angezeigt.

CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "token" TEXT NOT NULL,
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Review_token_key" ON "Review"("token");

CREATE INDEX "Review_status_approvedAt_idx" ON "Review"("status", "approvedAt");
