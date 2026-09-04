CREATE TABLE "EventUpdateNotice" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt" TIMESTAMP(3),
  "leaseUntil" TIMESTAMP(3),
  CONSTRAINT "EventUpdateNotice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EventUpdateNotice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventUpdateNotice_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "EventUpdateNotice_userId_createdAt_idx" ON "EventUpdateNotice"("userId", "createdAt");
CREATE INDEX "EventUpdateNotice_deliveredAt_leaseUntil_idx" ON "EventUpdateNotice"("deliveredAt", "leaseUntil");
