/*
  Warnings:

  - You are about to drop the column `planID` on the `enrollments` table. All the data in the column will be lost.
  - Added the required column `planId` to the `enrollments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "planID",
ADD COLUMN     "planId" TEXT NOT NULL;
