-- AlterTable
ALTER TABLE "Component" ADD COLUMN     "longDescription" TEXT,
ADD COLUMN     "maxDiscountAmount" DOUBLE PRECISION,
ADD COLUMN     "maxDiscountPercent" DOUBLE PRECISION,
ADD COLUMN     "productNumber" TEXT,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'Stück',
ADD COLUMN     "vatRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 19;
