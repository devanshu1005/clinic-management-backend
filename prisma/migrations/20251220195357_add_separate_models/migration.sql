/*
  Warnings:

  - You are about to drop the column `clinicName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `specialization` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `subsValidity` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `Doctor` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "GenderRoles" AS ENUM ('MALE', 'FEMALE', 'OTHERS');

-- DropForeignKey
ALTER TABLE "Doctor" DROP CONSTRAINT "Doctor_userId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "clinicName",
DROP COLUMN "departmentId",
DROP COLUMN "location",
DROP COLUMN "specialization",
DROP COLUMN "subsValidity",
ALTER COLUMN "role" SET DEFAULT 'PATIENT';

-- DropTable
DROP TABLE "Doctor";

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "subsValidity" TIMESTAMP(3) NOT NULL,
    "clinicLogo" TEXT,
    "clinicPhone" TEXT,
    "clinicEmail" TEXT,
    "address" TEXT,
    "gstin" TEXT,
    "panNumber" TEXT,
    "licenseNo" TEXT,
    "workingHours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "experience" TEXT,
    "salary" INTEGER NOT NULL,
    "shift" "Shift" NOT NULL,
    "gender" "GenderRoles" NOT NULL,
    "department" TEXT NOT NULL,
    "aadhaar" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "consultationFee" INTEGER,
    "availabilityDays" TEXT,
    "documentUrl" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_userId_key" ON "admins"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_gstin_key" ON "admins"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "admins_panNumber_key" ON "admins"("panNumber");

-- CreateIndex
CREATE INDEX "admins_clinicName_idx" ON "admins"("clinicName");

-- CreateIndex
CREATE INDEX "admins_subsValidity_idx" ON "admins"("subsValidity");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_userId_key" ON "doctors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_registrationNo_key" ON "doctors"("registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_aadhaar_key" ON "doctors"("aadhaar");

-- CreateIndex
CREATE INDEX "doctors_department_idx" ON "doctors"("department");

-- CreateIndex
CREATE INDEX "doctors_gender_idx" ON "doctors"("gender");

-- CreateIndex
CREATE INDEX "doctors_shift_idx" ON "doctors"("shift");

-- CreateIndex
CREATE INDEX "doctors_createdAt_idx" ON "doctors"("createdAt");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
