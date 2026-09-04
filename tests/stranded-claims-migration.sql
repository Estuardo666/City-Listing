-- Disposable PostgreSQL only. This test rolls back its minimal fixture schema.
BEGIN;
CREATE SCHEMA claim_migration_test;
SET LOCAL search_path = claim_migration_test;
CREATE TABLE "User" (id text PRIMARY KEY);
CREATE TABLE "Venue" (
  id text PRIMARY KEY, "claimedBy" text, claimed boolean, verified boolean
);
INSERT INTO "User" VALUES ('valid-owner');
INSERT INTO "Venue" VALUES
  ('orphan', 'missing-owner', true, true),
  ('valid', 'valid-owner', true, false),
  ('unclaimed', NULL, false, true),
  ('stranded', NULL, true, false);
\ir ../prisma/migrations/20260903020000_venue_claimed_by_foreign_key/migration.sql
\ir ../prisma/migrations/20260904000000_clear_stranded_venue_claims/migration.sql
-- Re-running the repair must be harmless.
\ir ../prisma/migrations/20260904000000_clear_stranded_venue_claims/migration.sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Venue" WHERE claimed AND "claimedBy" IS NULL) THEN
    RAISE EXCEPTION 'Stranded claim remains';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Venue" WHERE id='valid' AND claimed AND "claimedBy"='valid-owner' AND NOT verified) THEN
    RAISE EXCEPTION 'Valid ownership changed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Venue" WHERE id='orphan' AND NOT claimed AND "claimedBy" IS NULL AND verified) THEN
    RAISE EXCEPTION 'Orphan repair changed verification or failed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Venue" WHERE id='unclaimed' AND NOT claimed AND verified) THEN
    RAISE EXCEPTION 'Unclaimed venue changed';
  END IF;
END $$;
ROLLBACK;
