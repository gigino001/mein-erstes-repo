-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SALES',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Customer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEU',
    "wantsPv" BOOLEAN NOT NULL DEFAULT true,
    "wantsHeatPump" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PvData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "roofMaterial" TEXT,
    "annualConsumptionKwh" REAL,
    "personsCount" INTEGER,
    "homeOffice" BOOLEAN NOT NULL DEFAULT false,
    "hasHeatPumpExisting" BOOLEAN NOT NULL DEFAULT false,
    "hasWallbox" BOOLEAN NOT NULL DEFAULT false,
    "hasPool" BOOLEAN NOT NULL DEFAULT false,
    "hasAirConditioning" BOOLEAN NOT NULL DEFAULT false,
    "gridOperator" TEXT,
    "meterCabinetSufficient" BOOLEAN,
    "threePhase" BOOLEAN,
    "gridConnectionPowerKw" REAL,
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
    "calculatedKwp" REAL,
    "calculatedAnnualYieldKwh" REAL,
    "calculatedSelfConsumptionKwh" REAL,
    "calculatedAutarkyPercent" REAL,
    "calculatedFeedInKwh" REAL,
    "calculatedFeedInRevenue" REAL,
    "calculatedSavingsPerYear" REAL,
    "calculatedAmortizationYears" REAL,
    "calculatedCo2SavingsKg" REAL,
    CONSTRAINT "PvData_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PvData_moduleComponentId_fkey" FOREIGN KEY ("moduleComponentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PvData_inverterComponentId_fkey" FOREIGN KEY ("inverterComponentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PvData_storageComponentId_fkey" FOREIGN KEY ("storageComponentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PvData_wallboxComponentId_fkey" FOREIGN KEY ("wallboxComponentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PvData_emsComponentId_fkey" FOREIGN KEY ("emsComponentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PvData_mountingSystemComponentId_fkey" FOREIGN KEY ("mountingSystemComponentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoofSurface" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pvDataId" TEXT NOT NULL,
    "name" TEXT,
    "roofShape" TEXT,
    "orientation" TEXT,
    "tiltDegrees" REAL,
    "areaSqm" REAL,
    "usableAreaSqm" REAL,
    "shading" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RoofSurface_pvDataId_fkey" FOREIGN KEY ("pvDataId") REFERENCES "PvData" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HeatPumpData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "buildYear" INTEGER,
    "livingAreaSqm" REAL,
    "heatedAreaSqm" REAL,
    "insulationStandard" TEXT,
    "windowType" TEXT,
    "floorsCount" INTEGER,
    "currentHeatingType" TEXT,
    "annualConsumptionValue" REAL,
    "annualConsumptionUnit" TEXT,
    "heatEmitterType" TEXT,
    "flowTemperature" REAL,
    "personsCount" INTEGER,
    "hotWaterStorageLiters" REAL,
    "location" TEXT,
    "designOutdoorTemp" REAL,
    "heatPumpComponentId" TEXT,
    "bufferComponentId" TEXT,
    "calculatedHeatLoadKw" REAL,
    "calculatedAnnualConsumptionKwh" REAL,
    "calculatedJaz" REAL,
    "calculatedAnnualOperatingCost" REAL,
    "calculatedOldAnnualCost" REAL,
    "calculatedSavingsPerYear" REAL,
    "calculatedAmortizationYears" REAL,
    "calculatedCo2SavingsKg" REAL,
    CONSTRAINT "HeatPumpData_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HeatPumpData_heatPumpComponentId_fkey" FOREIGN KEY ("heatPumpComponentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HeatPumpData_bufferComponentId_fkey" FOREIGN KEY ("bufferComponentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Component" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "specs" TEXT NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CostItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "marginPercent" REAL NOT NULL DEFAULT 20,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "financingMonths" INTEGER,
    "financingInterestPercent" REAL,
    "totalCost" REAL,
    "salesPrice" REAL,
    "monthlyRate" REAL,
    CONSTRAINT "Pricing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "offerNumber" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalNet" REAL,
    "totalGross" REAL,
    CONSTRAINT "Offer_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PvData_projectId_key" ON "PvData"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "HeatPumpData_projectId_key" ON "HeatPumpData"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Pricing_projectId_key" ON "Pricing"("projectId");
