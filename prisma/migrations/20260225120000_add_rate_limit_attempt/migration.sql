-- CreateTable
CREATE TABLE "RateLimitAttempt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitAttempt_key_category_idx" ON "RateLimitAttempt"("key", "category");

-- CreateIndex
CREATE INDEX "RateLimitAttempt_attemptedAt_idx" ON "RateLimitAttempt"("attemptedAt");
