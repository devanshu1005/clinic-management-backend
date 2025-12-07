-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('MORNING', 'EVENING', 'ROTATIONAL');

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "experience" TEXT,
    "salary" INTEGER NOT NULL,
    "shift" "Shift" NOT NULL,
    "gender" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "aadhaar" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "consultationFee" INTEGER,
    "availabilityDays" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_userId_key" ON "Doctor"("userId");

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
