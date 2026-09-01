-- Mobile refresh sessions are additive and independent from NextAuth sessions.
CREATE TABLE "MobileRefreshSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "MobileRefreshSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MobileRefreshSession_tokenHash_key" ON "MobileRefreshSession"("tokenHash");
CREATE INDEX "MobileRefreshSession_userId_idx" ON "MobileRefreshSession"("userId");
CREATE INDEX "MobileRefreshSession_expiresAt_idx" ON "MobileRefreshSession"("expiresAt");

ALTER TABLE "MobileRefreshSession"
ADD CONSTRAINT "MobileRefreshSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
