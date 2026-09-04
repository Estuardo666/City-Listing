CREATE TABLE "InteractionEvent" (
  "id" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InteractionEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InteractionEvent_action_check" CHECK ("action" IN ('save', 'directions')),
  CONSTRAINT "InteractionEvent_source_check" CHECK ("source" IN ('web', 'ios', 'android'))
);
CREATE UNIQUE INDEX "InteractionEvent_dedupeKey_key" ON "InteractionEvent"("dedupeKey");
CREATE INDEX "InteractionEvent_kind_itemId_createdAt_idx" ON "InteractionEvent"("kind", "itemId", "createdAt");
CREATE INDEX "InteractionEvent_createdAt_idx" ON "InteractionEvent"("createdAt");
