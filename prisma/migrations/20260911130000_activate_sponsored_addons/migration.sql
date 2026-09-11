ALTER TABLE "Venue" ADD COLUMN "sponsoredUntil" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN "sponsoredUntil" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "eventId" TEXT;
ALTER TABLE "AddonPurchase" ADD COLUMN "eventId" TEXT;
ALTER TABLE "GooglePlaceUsage" ADD COLUMN "venueKey" TEXT NOT NULL DEFAULT 'global';
ALTER TABLE "GooglePlaceUsage" ADD COLUMN "venueId" TEXT;

CREATE INDEX "Venue_sponsoredUntil_idx" ON "Venue"("sponsoredUntil");
CREATE INDEX "Event_sponsoredUntil_idx" ON "Event"("sponsoredUntil");
CREATE INDEX "Order_eventId_createdAt_idx" ON "Order"("eventId", "createdAt");
CREATE INDEX "AddonPurchase_eventId_createdAt_idx" ON "AddonPurchase"("eventId", "createdAt");
DROP INDEX "GooglePlaceUsage_bucket_periodStart_endpoint_key";
CREATE UNIQUE INDEX "GooglePlaceUsage_bucket_periodStart_endpoint_venueKey_key" ON "GooglePlaceUsage"("bucket", "periodStart", "endpoint", "venueKey");
CREATE INDEX "GooglePlaceUsage_venueId_bucket_periodStart_idx" ON "GooglePlaceUsage"("venueId", "bucket", "periodStart");

ALTER TABLE "Order" ADD CONSTRAINT "Order_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AddonPurchase" ADD CONSTRAINT "AddonPurchase_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GooglePlaceUsage" ADD CONSTRAINT "GooglePlaceUsage_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
