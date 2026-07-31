/*
  Warnings:

  - The values [PENDING] on the enum `DeviceStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[enrollmentCode]` on the table `devices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeviceStatus_new" AS ENUM ('PENDING_ENROLLMENT', 'ACTIVE', 'LOCKED', 'DISABLED');
ALTER TABLE "public"."devices" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "devices" ALTER COLUMN "status" TYPE "DeviceStatus_new" USING ("status"::text::"DeviceStatus_new");
ALTER TYPE "DeviceStatus" RENAME TO "DeviceStatus_old";
ALTER TYPE "DeviceStatus_new" RENAME TO "DeviceStatus";
DROP TYPE "public"."DeviceStatus_old";
ALTER TABLE "devices" ALTER COLUMN "status" SET DEFAULT 'PENDING_ENROLLMENT';
COMMIT;

-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "autoLockEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "buyerDni" TEXT,
ADD COLUMN     "buyerName" TEXT,
ADD COLUMN     "buyerPhone" TEXT,
ADD COLUMN     "downPayment" DOUBLE PRECISION,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "enrollmentCode" TEXT,
ADD COLUMN     "gracePeriodDays" INTEGER DEFAULT 3,
ADD COLUMN     "installmentAmount" DOUBLE PRECISION,
ADD COLUMN     "paidInstallments" INTEGER DEFAULT 0,
ADD COLUMN     "paymentFrequency" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "totalInstallments" INTEGER,
ALTER COLUMN "imei" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING_ENROLLMENT';

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "tenantId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "devices_enrollmentCode_key" ON "devices"("enrollmentCode");
