-- CreateTable
CREATE TABLE "CircleInviteLink" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleInviteLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CircleInviteLink_token_key" ON "CircleInviteLink"("token");

-- CreateIndex
CREATE INDEX "CircleInviteLink_circleId_idx" ON "CircleInviteLink"("circleId");

-- AddForeignKey
ALTER TABLE "CircleInviteLink" ADD CONSTRAINT "CircleInviteLink_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleInviteLink" ADD CONSTRAINT "CircleInviteLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
