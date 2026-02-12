/*
  Warnings:

  - You are about to drop the column `sequence` on the `CircleSession` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CircleSession_circleId_sequence_key";

-- AlterTable
ALTER TABLE "CircleSession" DROP COLUMN "sequence";
