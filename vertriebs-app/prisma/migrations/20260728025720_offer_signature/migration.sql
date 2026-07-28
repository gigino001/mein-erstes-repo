-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "signatureBlobKey" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3);
