-- CreateTable
CREATE TABLE "FinancingRate" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "interestRatePercent" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FinancingRate_pkey" PRIMARY KEY ("id")
);
