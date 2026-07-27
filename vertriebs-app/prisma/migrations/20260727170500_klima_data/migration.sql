-- CreateTable
CREATE TABLE "ClimaData" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "insulationStandard" TEXT,
    "climaComponentId" TEXT,
    "unitsCount" INTEGER,
    "calculatedTotalCoolingLoadKw" DOUBLE PRECISION,
    "calculatedRecommendedUnitsCount" INTEGER,
    "calculatedEstimatedAnnualOperatingCost" DOUBLE PRECISION,

    CONSTRAINT "ClimaData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KlimaRoom" (
    "id" TEXT NOT NULL,
    "climaDataId" TEXT NOT NULL,
    "name" TEXT,
    "areaSqm" DOUBLE PRECISION,
    "ceilingHeightM" DOUBLE PRECISION,
    "shading" TEXT,
    "occupantsCount" INTEGER,
    "hasHeatSources" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "calculatedLoadKw" DOUBLE PRECISION,

    CONSTRAINT "KlimaRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClimaData_projectId_key" ON "ClimaData"("projectId");

-- AddForeignKey
ALTER TABLE "ClimaData" ADD CONSTRAINT "ClimaData_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClimaData" ADD CONSTRAINT "ClimaData_climaComponentId_fkey" FOREIGN KEY ("climaComponentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KlimaRoom" ADD CONSTRAINT "KlimaRoom_climaDataId_fkey" FOREIGN KEY ("climaDataId") REFERENCES "ClimaData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
