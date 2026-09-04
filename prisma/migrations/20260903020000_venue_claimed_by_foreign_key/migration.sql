-- `Venue.claimedBy` held a user id as a plain string, so a deleted account left
-- a venue pointing at nobody and nothing complained. Clean the orphans first,
-- then constrain the column.

UPDATE "Venue"
SET "claimedBy" = NULL
WHERE "claimedBy" IS NOT NULL
  AND "claimedBy" NOT IN (SELECT "id" FROM "User");

CREATE INDEX IF NOT EXISTS "Venue_claimedBy_idx" ON "Venue"("claimedBy");

ALTER TABLE "Venue"
ADD CONSTRAINT "Venue_claimedBy_fkey"
FOREIGN KEY ("claimedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
