-- Day-by-day itineraries.
--
-- Every existing stop belongs to a single-day route, so `day` defaults to 1 and
-- the old rows are correct without a data migration. The unique key has to move
-- from (routeId, order) to (routeId, day, order) or two days could never reuse
-- the same ordinal.

ALTER TABLE "Route"
    ADD COLUMN "days" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "distanceMeters" INTEGER,
    ADD COLUMN "estimatedMinutes" INTEGER,
    ADD COLUMN "startLat" DOUBLE PRECISION,
    ADD COLUMN "startLng" DOUBLE PRECISION;

ALTER TABLE "RouteStop"
    ADD COLUMN "day" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "startTime" TEXT,
    ADD COLUMN "lat" DOUBLE PRECISION,
    ADD COLUMN "lng" DOUBLE PRECISION,
    ADD COLUMN "image" TEXT,
    ADD COLUMN "travelMinutes" INTEGER;

-- Seed the stop coordinates from the venue they point at, so the itinerary map
-- has geometry for rows created before this column existed.
UPDATE "RouteStop" AS s
SET "lat" = v."lat", "lng" = v."lng"
FROM "Venue" AS v
WHERE s."venueId" = v."id" AND s."lat" IS NULL AND v."lat" IS NOT NULL;

DROP INDEX IF EXISTS "RouteStop_routeId_order_key";
CREATE UNIQUE INDEX "RouteStop_routeId_day_order_key" ON "RouteStop"("routeId", "day", "order");
CREATE INDEX "RouteStop_routeId_day_order_idx" ON "RouteStop"("routeId", "day", "order");
