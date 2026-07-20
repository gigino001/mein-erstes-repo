-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SALES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "salutation" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "company" TEXT,
    "street" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "buildingType" TEXT,
    "buildYear" INTEGER,
    "contactPerson" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEU',
    "wantsPv" BOOLEAN NOT NULL DEFAULT true,
    "wantsHeatPump" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PvData" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "roofMaterial" TEXT,
    "annualConsumptionKwh" DOUBLE PRECISION,
    "personsCount" INTEGER,
    "homeOffice" BOOLEAN NOT NULL DEFAULT false,
    "hasHeatPumpExisting" BOOLEAN NOT NULL DEFAULT false,
    "hasWallbox" BOOLEAN NOT NULL DEFAULT false,
    "hasPool" BOOLEAN NOT NULL DEFAULT false,
    "hasAirConditioning" BOOLEAN NOT NULL DEFAULT false,
    "gridOperator" TEXT,
    "meterCabinetSufficient" BOOLEAN,
    "threePhase" BOOLEAN,
    "gridConnectionPowerKw" DOUBLE PRECISION,
    "goalMaxSelfSupply" BOOLEAN NOT NULL DEFAULT false,
    "goalMaxYield" BOOLEAN NOT NULL DEFAULT false,
    "goalBackupPower" BOOLEAN NOT NULL DEFAULT false,
    "goalEmergencyPower" BOOLEAN NOT NULL DEFAULT false,
    "goalLowCost" BOOLEAN NOT NULL DEFAULT false,
    "moduleComponentId" TEXT,
    "moduleCount" INTEGER,
    "inverterComponentId" TEXT,
    "storageComponentId" TEXT,
    "wallboxComponentId" TEXT,
    "emsComponentId" TEXT,
    "mountingSystemComponentId" TEXT,
    "calculatedKwp" DOUBLE PRECISION,
    "calculatedAnnualYieldKwh" DOUBLE PRECISION,
    "calculatedSelfConsumptionKwh" DOUBLE PRECISION,
    "calculatedAutarkyPercent" DOUBLE PRECISION,
    "calculatedFeedInKwh" DOUBLE PRECISION,
    "calculatedFeedInRevenue" DOUBLE PRECISION,
    "calculatedSavingsPerYear" DOUBLE PRECISION,
    "calculatedAmortizationYears" DOUBLE PRECISION,
    "calculatedCo2SavingsKg" DOUBLE PRECISION,

    CONSTRAINT "PvData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoofSurface" (
    "id" TEXT NOT NULL,
    "pvDataId" TEXT NOT NULL,
    "name" TEXT,
    "roofShape" TEXT,
    "orientation" TEXT,
    "tiltDegrees" DOUBLE PRECISION,
    "areaSqm" DOUBLE PRECISION,
    "usableAreaSqm" DOUBLE PRECISION,
    "shading" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RoofSurface_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeatPumpData" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "buildYear" INTEGER,
    "livingAreaSqm" DOUBLE PRECISION,
    "heatedAreaSqm" DOUBLE PRECISION,
    "insulationStandard" TEXT,
    "windowType" TEXT,
    "floorsCount" INTEGER,
    "currentHeatingType" TEXT,
    "annualConsumptionValue" DOUBLE PRECISION,
    "annualConsumptionUnit" TEXT,
    "heatEmitterType" TEXT,
    "flowTemperature" DOUBLE PRECISION,
    "personsCount" INTEGER,
    "hotWaterStorageLiters" DOUBLE PRECISION,
    "location" TEXT,
    "designOutdoorTemp" DOUBLE PRECISION,
    "heatPumpComponentId" TEXT,
    "bufferComponentId" TEXT,
    "calculatedHeatLoadKw" DOUBLE PRECISION,
    "calculatedAnnualConsumptionKwh" DOUBLE PRECISION,
    "calculatedJaz" DOUBLE PRECISION,
    "calculatedAnnualOperatingCost" DOUBLE PRECISION,
    "calculatedOldAnnualCost" DOUBLE PRECISION,
    "calculatedSavingsPerYear" DOUBLE PRECISION,
    "calculatedAmortizationYears" DOUBLE PRECISION,
    "calculatedCo2SavingsKg" DOUBLE PRECISION,

    CONSTRAINT "HeatPumpData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Component" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "specs" TEXT NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pricing" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "marginPercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "financingMonths" INTEGER,
    "financingInterestPercent" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "salesPrice" DOUBLE PRECISION,
    "monthlyRate" DOUBLE PRECISION,

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "offerNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalNet" DOUBLE PRECISION,
    "totalGross" DOUBLE PRECISION,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PvData_projectId_key" ON "PvData"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "HeatPumpData_projectId_key" ON "HeatPumpData"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Pricing_projectId_key" ON "Pricing"("projectId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvData" ADD CONSTRAINT "PvData_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvData" ADD CONSTRAINT "PvData_moduleComponentId_fkey" FOREIGN KEY ("moduleComponentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvData" ADD CONSTRAINT "PvData_inverterComponentId_fkey" FOREIGN KEY ("inverterComponentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvData" ADD CONSTRAINT "PvData_storageComponentId_fkey" FOREIGN KEY ("storageComponentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvData" ADD CONSTRAINT "PvData_wallboxComponentId_fkey" FOREIGN KEY ("wallboxComponentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvData" ADD CONSTRAINT "PvData_emsComponentId_fkey" FOREIGN KEY ("emsComponentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvData" ADD CONSTRAINT "PvData_mountingSystemComponentId_fkey" FOREIGN KEY ("mountingSystemComponentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoofSurface" ADD CONSTRAINT "RoofSurface_pvDataId_fkey" FOREIGN KEY ("pvDataId") REFERENCES "PvData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatPumpData" ADD CONSTRAINT "HeatPumpData_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatPumpData" ADD CONSTRAINT "HeatPumpData_heatPumpComponentId_fkey" FOREIGN KEY ("heatPumpComponentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatPumpData" ADD CONSTRAINT "HeatPumpData_bufferComponentId_fkey" FOREIGN KEY ("bufferComponentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pricing" ADD CONSTRAINT "Pricing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
