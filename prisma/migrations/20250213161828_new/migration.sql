/*
  Warnings:

  - Added the required column `planID` to the `enrollments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "planID" TEXT NOT NULL;
