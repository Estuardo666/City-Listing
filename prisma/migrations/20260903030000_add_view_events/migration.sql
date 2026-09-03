-- Timestamped views, so "popular now" can look at a window instead of the
-- lifetime `viewCount` counters, which never decay.
CREATE TABLE "ViewEvent" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT,
    "anonId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'web',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ViewEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ViewEvent_kind_itemId_createdAt_idx" ON "ViewEvent"("kind", "itemId", "createdAt");
CREATE INDEX "ViewEvent_createdAt_idx" ON "ViewEvent"("createdAt");
