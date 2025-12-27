-- CreateEnum
CREATE TYPE "StaffCategory" AS ENUM ('NURSE', 'LAB_TECH', 'PHARMACY', 'ATTENDANT', 'CLEANING', 'OTHER');

-- CreateTable
CREATE TABLE "receptionists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experience" TEXT,
    "salary" INTEGER NOT NULL,
    "shift" "Shift" NOT NULL,
    "gender" "GenderRoles" NOT NULL,
    "aadhaar" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "deskNumber" TEXT,
    "shiftTiming" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receptionists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staffs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "category" "StaffCategory" NOT NULL,
    "experience" TEXT,
    "salary" INTEGER NOT NULL,
    "shift" "Shift" NOT NULL,
    "gender" "GenderRoles" NOT NULL,
    "aadhaar" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "registrationNo" TEXT,
    "department" TEXT,
    "staffCode" TEXT,
    "joiningDate" TIMESTAMP(3),
    "roleBadge" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receptionists_userId_key" ON "receptionists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "receptionists_aadhaar_key" ON "receptionists"("aadhaar");

-- CreateIndex
CREATE INDEX "receptionists_shift_idx" ON "receptionists"("shift");

-- CreateIndex
CREATE INDEX "receptionists_gender_idx" ON "receptionists"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "staffs_userId_key" ON "staffs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "staffs_aadhaar_key" ON "staffs"("aadhaar");

-- CreateIndex
CREATE INDEX "staffs_category_idx" ON "staffs"("category");

-- CreateIndex
CREATE INDEX "staffs_shift_idx" ON "staffs"("shift");

-- CreateIndex
CREATE INDEX "staffs_department_idx" ON "staffs"("department");

-- AddForeignKey
ALTER TABLE "receptionists" ADD CONSTRAINT "receptionists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
