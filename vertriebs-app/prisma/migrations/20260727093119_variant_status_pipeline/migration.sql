-- AlterTable: Kunde bekommt Interessenten-Pipeline-Status
ALTER TABLE "Customer" ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "pipelineStatus" TEXT NOT NULL DEFAULT 'INTERESSENT';

-- CreateTable: Status-Workflows je Auftragsvariante
CREATE TABLE "StatusDefinition" (
    "id" TEXT NOT NULL,
    "variantType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,

    CONSTRAINT "StatusDefinition_pkey" PRIMARY KEY ("id")
);

-- Seed: Standard-Status-Workflows je Auftragsvariante
INSERT INTO "StatusDefinition" ("id", "variantType", "name", "sortOrder", "isTerminal") VALUES
  ('status-pv-neu', 'PV', 'Neu', 0, false),
  ('status-pv-angebot', 'PV', 'Angebot', 1, false),
  ('status-pv-auftrag', 'PV', 'Auftrag', 2, false),
  ('status-pv-material', 'PV', 'Material bestellt', 3, false),
  ('status-pv-montage', 'PV', 'Montage geplant', 4, false),
  ('status-pv-abgeschlossen', 'PV', 'Abgeschlossen', 5, true),
  ('status-wp-neu', 'WAERMEPUMPE', 'Neu', 0, false),
  ('status-wp-angebot', 'WAERMEPUMPE', 'Angebot', 1, false),
  ('status-wp-auftrag', 'WAERMEPUMPE', 'Auftrag', 2, false),
  ('status-wp-material', 'WAERMEPUMPE', 'Material bestellt', 3, false),
  ('status-wp-montage', 'WAERMEPUMPE', 'Montage geplant', 4, false),
  ('status-wp-abgeschlossen', 'WAERMEPUMPE', 'Abgeschlossen', 5, true),
  ('status-klima-neu', 'KLIMA', 'Neu', 0, false),
  ('status-klima-angebot', 'KLIMA', 'Angebot', 1, false),
  ('status-klima-auftrag', 'KLIMA', 'Auftrag', 2, false),
  ('status-klima-abgeschlossen', 'KLIMA', 'Abgeschlossen', 3, true),
  ('status-wartung-neu', 'WARTUNG', 'Neu', 0, false),
  ('status-wartung-angebot', 'WARTUNG', 'Angebot', 1, false),
  ('status-wartung-auftrag', 'WARTUNG', 'Auftrag', 2, false),
  ('status-wartung-abgeschlossen', 'WARTUNG', 'Abgeschlossen', 3, true),
  ('status-elektro-neu', 'ELEKTROINSTALLATION', 'Neu', 0, false),
  ('status-elektro-angebot', 'ELEKTROINSTALLATION', 'Angebot', 1, false),
  ('status-elektro-auftrag', 'ELEKTROINSTALLATION', 'Auftrag', 2, false),
  ('status-elektro-abgeschlossen', 'ELEKTROINSTALLATION', 'Abgeschlossen', 3, true),
  ('status-heizsan-neu', 'HEIZUNG_SANITAER_NEUBAU', 'Neu', 0, false),
  ('status-heizsan-angebot', 'HEIZUNG_SANITAER_NEUBAU', 'Angebot', 1, false),
  ('status-heizsan-auftrag', 'HEIZUNG_SANITAER_NEUBAU', 'Auftrag', 2, false),
  ('status-heizsan-abgeschlossen', 'HEIZUNG_SANITAER_NEUBAU', 'Abgeschlossen', 3, true);

-- AlterTable: neue Spalten zunächst nullable, damit bestehende Zeilen nicht brechen
ALTER TABLE "Project" ADD COLUMN     "offerExpiresAt" TIMESTAMP(3),
ADD COLUMN     "variantType" TEXT,
ADD COLUMN     "statusId" TEXT;

-- Backfill: variantType aus den alten Boolean-Feldern ableiten
UPDATE "Project" SET "variantType" = CASE
  WHEN "wantsPv" = true THEN 'PV'
  WHEN "wantsHeatPump" = true THEN 'WAERMEPUMPE'
  ELSE 'PV'
END;

-- Backfill: statusId aus dem alten status-String + neuer variantType ableiten
UPDATE "Project" SET "statusId" = CASE "variantType"
  WHEN 'PV' THEN CASE "status"
    WHEN 'NEU' THEN 'status-pv-neu'
    WHEN 'ANGEBOT' THEN 'status-pv-angebot'
    WHEN 'AUFTRAG' THEN 'status-pv-auftrag'
    WHEN 'ABGESCHLOSSEN' THEN 'status-pv-abgeschlossen'
    ELSE 'status-pv-neu'
  END
  WHEN 'WAERMEPUMPE' THEN CASE "status"
    WHEN 'NEU' THEN 'status-wp-neu'
    WHEN 'ANGEBOT' THEN 'status-wp-angebot'
    WHEN 'AUFTRAG' THEN 'status-wp-auftrag'
    WHEN 'ABGESCHLOSSEN' THEN 'status-wp-abgeschlossen'
    ELSE 'status-wp-neu'
  END
  ELSE 'status-pv-neu'
END;

-- AlterTable: Spalten jetzt verpflichtend machen, alte Spalten entfernen
ALTER TABLE "Project" ALTER COLUMN "variantType" SET NOT NULL,
ALTER COLUMN "statusId" SET NOT NULL;

ALTER TABLE "Project" DROP COLUMN "status",
DROP COLUMN "wantsHeatPump",
DROP COLUMN "wantsPv";

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
