-- Forward-only repair: the earlier foreign-key migration is already applied.
-- It cleared orphaned claimedBy values but left claimed=true. Do not rewrite
-- its checksum or history. Preserve valid ownership and editorial verification.
UPDATE "Venue"
SET "claimed" = false
WHERE "claimed" = true AND "claimedBy" IS NULL;
