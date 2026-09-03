-- `Venue.claimedBy` held a user id as a plain string, so a deleted account left
-- a venue pointing at nobody and nothing complained. Clean the orphans first,
-- then constrain the column.

-- `claimed` has to fall with `claimedBy`: a venue flagged as claimed with no
-- claimer can never be claimed again, because the CTA checks that flag. The
-- `verified` badge is editorial and stays as an admin left it.
UPDATE "Venue"
SET "claimedBy" = NULL,
    "claimed" = false
WHERE "claimedBy" IS NOT NULL
  AND "claimedBy" NOT IN (SELECT "id" FROM "User");

CREATE INDEX IF NOT EXISTS "Venue_claimedBy_idx" ON "Venue"("claimedBy");

ALTER TABLE "Venue"
ADD CONSTRAINT "Venue_claimedBy_fkey"
FOREIGN KEY ("claimedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
