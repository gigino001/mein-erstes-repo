-- AlterTable
ALTER TABLE "Component" ADD COLUMN     "usesNaturalRefrigerant" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "annualHouseholdIncomeEur" DOUBLE PRECISION,
ADD COLUMN     "usageType" TEXT NOT NULL DEFAULT 'SELBSTGENUTZT';

-- AlterTable
ALTER TABLE "HeatPumpData" ADD COLUMN     "oldHeatingInstallYear" INTEGER;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "isNewBuilding" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "FundingProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "appliesTo" TEXT NOT NULL,
    "fundingType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "percentageOfCost" DOUBLE PRECISION,
    "maxAmountEur" DOUBLE PRECISION,
    "requiresExistingBuilding" BOOLEAN NOT NULL DEFAULT false,
    "requiresOwnerOccupied" BOOLEAN NOT NULL DEFAULT false,
    "maxHouseholdIncomeEur" DOUBLE PRECISION,
    "conditions" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingProgram_pkey" PRIMARY KEY ("id")
);
