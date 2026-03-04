-- CreateTable
CREATE TABLE "RoundRobinSchedule" (
    "id" TEXT NOT NULL,
    "circleSessionId" TEXT NOT NULL,
    "totalMatchCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoundRobinSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundRobinRound" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,

    CONSTRAINT "RoundRobinRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundRobinPairing" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,

    CONSTRAINT "RoundRobinPairing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoundRobinSchedule_circleSessionId_key" ON "RoundRobinSchedule"("circleSessionId");

-- CreateIndex
CREATE INDEX "RoundRobinRound_scheduleId_idx" ON "RoundRobinRound"("scheduleId");

-- CreateIndex
CREATE INDEX "RoundRobinPairing_roundId_idx" ON "RoundRobinPairing"("roundId");

-- AddForeignKey
ALTER TABLE "RoundRobinSchedule" ADD CONSTRAINT "RoundRobinSchedule_circleSessionId_fkey" FOREIGN KEY ("circleSessionId") REFERENCES "CircleSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundRobinRound" ADD CONSTRAINT "RoundRobinRound_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "RoundRobinSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundRobinPairing" ADD CONSTRAINT "RoundRobinPairing_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "RoundRobinRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundRobinPairing" ADD CONSTRAINT "RoundRobinPairing_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundRobinPairing" ADD CONSTRAINT "RoundRobinPairing_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
