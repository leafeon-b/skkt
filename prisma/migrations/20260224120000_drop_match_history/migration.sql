-- DropForeignKey
ALTER TABLE "MatchHistory" DROP CONSTRAINT IF EXISTS "MatchHistory_matchId_fkey";
ALTER TABLE "MatchHistory" DROP CONSTRAINT IF EXISTS "MatchHistory_editorId_fkey";

-- DropTable
DROP TABLE IF EXISTS "MatchHistory";

-- DropEnum
DROP TYPE IF EXISTS "MatchHistoryAction";
