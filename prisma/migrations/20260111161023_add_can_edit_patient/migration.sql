/*
  Warnings:

  - You are about to drop the column `CanEditPatient` on the `receptionists` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "receptionists" DROP COLUMN "CanEditPatient",
ADD COLUMN     "canEditPatient" BOOLEAN NOT NULL DEFAULT false;
