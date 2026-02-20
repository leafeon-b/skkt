-- AlterTable
ALTER TABLE "CircleMembership" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CircleSessionMembership" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- DropIndex
DROP INDEX "CircleMembership_userId_circleId_key";

-- DropIndex
DROP INDEX "CircleSessionMembership_userId_circleSessionId_key";

-- CreateIndex: 部分ユニークインデックス（アクティブレコードのみ一意性を保証）
CREATE UNIQUE INDEX "CircleMembership_userId_circleId_key"
  ON "CircleMembership"("userId", "circleId")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "CircleSessionMembership_userId_circleSessionId_key"
  ON "CircleSessionMembership"("userId", "circleSessionId")
  WHERE "deletedAt" IS NULL;
