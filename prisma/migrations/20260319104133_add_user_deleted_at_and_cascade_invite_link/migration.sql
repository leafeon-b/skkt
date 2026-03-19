-- DropForeignKey
ALTER TABLE "CircleInviteLink" DROP CONSTRAINT "CircleInviteLink_createdByUserId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "CircleInviteLink" ADD CONSTRAINT "CircleInviteLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
