-- Step 1: Add createdAt column to Match (nullable initially)
ALTER TABLE "Match" ADD COLUMN "createdAt" TIMESTAMP(3);

-- Step 2: Populate createdAt for existing rows based on order
-- Use a base timestamp and add order * 1 second to preserve ordering
-- Note: These timestamps are synthetic and do not represent actual creation times.
-- They preserve relative ordering within each session only.
UPDATE "Match"
SET "createdAt" = TIMESTAMP '2025-01-01 00:00:00' + ("order" * INTERVAL '1 second');

-- Step 3: Make createdAt NOT NULL with default
ALTER TABLE "Match" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Step 4: Drop the unique constraint on (circleSessionId, order)
ALTER TABLE "Match" DROP CONSTRAINT "Match_circleSessionId_order_key";

-- Step 5: Drop the order column from Match
ALTER TABLE "Match" DROP COLUMN "order";

-- Step 6: Drop the order column from MatchHistory
ALTER TABLE "MatchHistory" DROP COLUMN "order";

-- Step 7: Add index on (circleSessionId, createdAt) for Match
CREATE INDEX "Match_circleSessionId_createdAt_idx" ON "Match"("circleSessionId", "createdAt");
