-- Saving someone else's public collection. Additive: existing favorites keep a
-- NULL collectionId, and the partial-style unique index behaves the same way as
-- the other four (Postgres treats NULLs as distinct).
ALTER TABLE "Favorite" ADD COLUMN "collectionId" TEXT;

CREATE UNIQUE INDEX "Favorite_userId_collectionId_key" ON "Favorite"("userId", "collectionId");

ALTER TABLE "Favorite"
ADD CONSTRAINT "Favorite_collectionId_fkey"
FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
