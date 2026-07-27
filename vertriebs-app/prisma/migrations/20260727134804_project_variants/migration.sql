-- CreateTable
CREATE TABLE "ProjectVariant" (
    "id" TEXT NOT NULL,
    "variantType" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,

    CONSTRAINT "ProjectVariant_pkey" PRIMARY KEY ("id")
);

-- Backfill: eine ProjectVariant-Zeile je bestehendem Project (bisher genau
-- eine Auftragsvariante pro Vorgang), Status wird 1:1 übernommen.
INSERT INTO "ProjectVariant" ("id", "variantType", "projectId", "statusId")
SELECT gen_random_uuid()::text, "variantType", "id", "statusId" FROM "Project";

-- CreateIndex
CREATE UNIQUE INDEX "ProjectVariant_projectId_variantType_key" ON "ProjectVariant"("projectId", "variantType");

-- AddForeignKey
ALTER TABLE "ProjectVariant" ADD CONSTRAINT "ProjectVariant_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectVariant" ADD CONSTRAINT "ProjectVariant_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey (alte Project.statusId-Verknüpfung, jetzt via ProjectVariant)
ALTER TABLE "Project" DROP CONSTRAINT "Project_statusId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "statusId",
DROP COLUMN "variantType";
