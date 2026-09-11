-- Business accounts and the versioned beta billing domain.
-- All new links are nullable on Venue so this migration is safe for the
-- existing userId/claimedBy ownership model while the application migrates.

ALTER TABLE "Venue" ADD COLUMN "businessAccountId" TEXT;
ALTER TABLE "VenueClaim" ADD COLUMN "selectedPlanVersionId" TEXT;
ALTER TABLE "VenueClaim" ADD COLUMN "planSelectionStatus" TEXT;

CREATE TABLE "BusinessAccount" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessMembership" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'OWNER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Plan" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanVersion" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "monthlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "annualPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "maxLocations" INTEGER,
  "maxMembers" INTEGER,
  "maxMediaPerVenue" INTEGER,
  "googlePhotoEnabled" BOOLEAN NOT NULL DEFAULT true,
  "menuEnabled" BOOLEAN NOT NULL DEFAULT false,
  "servicesEnabled" BOOLEAN NOT NULL DEFAULT true,
  "monthlyEventsPerVenue" INTEGER,
  "maxActivePromotionsPerVenue" INTEGER,
  "analyticsRetentionDays" INTEGER,
  "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
  "messagingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "reservationsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "priorityModeration" BOOLEAN NOT NULL DEFAULT false,
  "includedBoostCredits" INTEGER NOT NULL DEFAULT 0,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlanVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "planVersionId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "cycle" TEXT NOT NULL DEFAULT 'MONTHLY',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "renewsAutomatically" BOOLEAN NOT NULL DEFAULT false,
  "referencePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "mode" TEXT NOT NULL DEFAULT 'SIMULATED',
  "source" TEXT NOT NULL DEFAULT 'CHECKOUT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VenuePlanOverride" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "planVersionId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "revokedAt" TIMESTAMP(3),
  "revokedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VenuePlanOverride_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AddonProduct" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL DEFAULT 'DIGITAL',
  "price" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "durationDays" INTEGER,
  "requiresDelivery" BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AddonProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "venueId" TEXT,
  "claimId" TEXT,
  "planVersionId" TEXT,
  "addonProductId" TEXT,
  "idempotencyKey" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'SUBSCRIPTION',
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "mode" TEXT NOT NULL DEFAULT 'SIMULATED',
  "cycle" TEXT,
  "referenceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "chargedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "device" TEXT,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AddonPurchase" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "addonProductId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "venueId" TEXT,
  "deliveryStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AddonPurchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsageCounter" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "venueId" TEXT,
  "metric" TEXT NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 0,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "accountId" TEXT,
  "venueId" TEXT,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GooglePlaceUsage" (
  "id" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "endpoint" TEXT NOT NULL,
  "requests" INTEGER NOT NULL DEFAULT 0,
  "successes" INTEGER NOT NULL DEFAULT 0,
  "errors" INTEGER NOT NULL DEFAULT 0,
  "quotaErrors" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GooglePlaceUsage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingSetting" (
  "id" TEXT NOT NULL DEFAULT 'global',
  "simulationEnabled" BOOLEAN NOT NULL DEFAULT true,
  "googlePhotoEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedById" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");
CREATE UNIQUE INDEX "PlanVersion_planId_version_key" ON "PlanVersion"("planId", "version");
CREATE UNIQUE INDEX "BusinessMembership_accountId_userId_key" ON "BusinessMembership"("accountId", "userId");
CREATE UNIQUE INDEX "AddonProduct_slug_key" ON "AddonProduct"("slug");
CREATE UNIQUE INDEX "Order_claimId_key" ON "Order"("claimId");
CREATE UNIQUE INDEX "Order_accountId_idempotencyKey_key" ON "Order"("accountId", "idempotencyKey");
CREATE UNIQUE INDEX "AddonPurchase_orderId_key" ON "AddonPurchase"("orderId");
CREATE UNIQUE INDEX "UsageCounter_accountId_venueId_metric_periodStart_key" ON "UsageCounter"("accountId", "venueId", "metric", "periodStart");
CREATE UNIQUE INDEX "GooglePlaceUsage_bucket_periodStart_endpoint_key" ON "GooglePlaceUsage"("bucket", "periodStart", "endpoint");

CREATE INDEX "BusinessAccount_ownerId_idx" ON "BusinessAccount"("ownerId");
CREATE INDEX "BusinessMembership_userId_idx" ON "BusinessMembership"("userId");
CREATE INDEX "Plan_idx" ON "Plan"("isPublished", "isArchived", "displayOrder");
CREATE INDEX "PlanVersion_idx" ON "PlanVersion"("planId", "isPublished");
CREATE INDEX "Subscription_idx" ON "Subscription"("accountId", "status", "endsAt");
CREATE INDEX "VenuePlanOverride_idx" ON "VenuePlanOverride"("venueId", "status", "startsAt", "endsAt");
CREATE INDEX "Order_account_created_idx" ON "Order"("accountId", "createdAt");
CREATE INDEX "Order_buyer_created_idx" ON "Order"("buyerId", "createdAt");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "UsageCounter_account_metric_idx" ON "UsageCounter"("accountId", "metric", "periodStart");
CREATE INDEX "BillingAuditLog_account_created_idx" ON "BillingAuditLog"("accountId", "createdAt");
CREATE INDEX "BillingAuditLog_venue_created_idx" ON "BillingAuditLog"("venueId", "createdAt");
CREATE INDEX "GooglePlaceUsage_bucket_period_idx" ON "GooglePlaceUsage"("bucket", "periodStart");
CREATE INDEX "Venue_businessAccountId_idx" ON "Venue"("businessAccountId");
CREATE INDEX "VenueClaim_selectedPlanVersionId_idx" ON "VenueClaim"("selectedPlanVersionId");

ALTER TABLE "BusinessAccount" ADD CONSTRAINT "BusinessAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessMembership" ADD CONSTRAINT "BusinessMembership_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BusinessAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessMembership" ADD CONSTRAINT "BusinessMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BusinessAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VenuePlanOverride" ADD CONSTRAINT "VenuePlanOverride_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VenuePlanOverride" ADD CONSTRAINT "VenuePlanOverride_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VenuePlanOverride" ADD CONSTRAINT "VenuePlanOverride_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "BusinessAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BusinessAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "VenueClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_addonProductId_fkey" FOREIGN KEY ("addonProductId") REFERENCES "AddonProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AddonPurchase" ADD CONSTRAINT "AddonPurchase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AddonPurchase" ADD CONSTRAINT "AddonPurchase_addonProductId_fkey" FOREIGN KEY ("addonProductId") REFERENCES "AddonProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AddonPurchase" ADD CONSTRAINT "AddonPurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AddonPurchase" ADD CONSTRAINT "AddonPurchase_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BusinessAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingAuditLog" ADD CONSTRAINT "BillingAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingAuditLog" ADD CONSTRAINT "BillingAuditLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BusinessAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingAuditLog" ADD CONSTRAINT "BillingAuditLog_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VenueClaim" ADD CONSTRAINT "VenueClaim_selectedPlanVersionId_fkey" FOREIGN KEY ("selectedPlanVersionId") REFERENCES "PlanVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingSetting" ADD CONSTRAINT "BillingSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill one account per existing user who owns at least one listing and
-- give every migrated account the same non-expiring Free subscription.
INSERT INTO "Plan" ("id", "slug", "name", "description", "isPublished", "displayOrder", "updatedAt")
VALUES ('plan_free', 'free', 'Gratis', 'Presencia esencial para empezar.', true, 0, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "PlanVersion" ("id", "planId", "version", "monthlyPrice", "annualPrice", "maxLocations", "maxMembers", "maxMediaPerVenue", "googlePhotoEnabled", "menuEnabled", "servicesEnabled", "monthlyEventsPerVenue", "maxActivePromotionsPerVenue", "whatsappEnabled", "messagingEnabled", "reservationsEnabled", "priorityModeration", "includedBoostCredits", "isPublished", "publishedAt", "createdAt")
VALUES ('plan_free_v1', 'plan_free', 1, 0, 0, 1, 1, 0, true, false, true, 0, 0, false, false, false, false, 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("planId", "version") DO NOTHING;

INSERT INTO "Plan" ("id", "slug", "name", "description", "isPublished", "displayOrder", "updatedAt") VALUES
  ('plan_plus', 'plus', 'Plus', 'Más presencia y actividad para tu negocio.', true, 1, CURRENT_TIMESTAMP),
  ('plan_pro', 'pro', 'Pro', 'Herramientas completas para crecer y convertir.', true, 2, CURRENT_TIMESTAMP),
  ('plan_red', 'red', 'Red', 'Una solución configurable para varias ubicaciones.', true, 3, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "PlanVersion" ("id", "planId", "version", "monthlyPrice", "annualPrice", "maxLocations", "maxMembers", "maxMediaPerVenue", "googlePhotoEnabled", "menuEnabled", "servicesEnabled", "monthlyEventsPerVenue", "maxActivePromotionsPerVenue", "analyticsRetentionDays", "whatsappEnabled", "messagingEnabled", "reservationsEnabled", "priorityModeration", "includedBoostCredits", "isPublished", "publishedAt", "createdAt") VALUES
  ('plan_plus_v1', 'plan_plus', 1, 9.90, 99, 2, 2, 15, true, true, true, 4, 2, 90, true, true, false, true, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan_pro_v1', 'plan_pro', 1, 24.90, 249, 4, 5, 30, true, true, true, NULL, 10, NULL, true, true, true, true, 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan_red_v1', 'plan_red', 1, 99, 0, NULL, NULL, NULL, true, true, true, NULL, NULL, NULL, true, true, true, true, 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("planId", "version") DO NOTHING;
INSERT INTO "AddonProduct" ("id", "slug", "name", "description", "type", "price", "durationDays", "requiresDelivery", "isPublished", "displayOrder", "updatedAt") VALUES
  ('addon_boost_7d', 'boost-7d', 'Local destacado · 7 días', 'Posicionamiento patrocinado durante siete días.', 'DIGITAL', 2.99, 7, false, true, 0, CURRENT_TIMESTAMP),
  ('addon_boost_30d', 'boost-30d', 'Local destacado · 30 días', 'Posicionamiento patrocinado durante treinta días.', 'DIGITAL', 9.99, 30, false, true, 1, CURRENT_TIMESTAMP),
  ('addon_event_7d', 'event-boost-7d', 'Evento promocionado · 7 días', 'Promoción patrocinada para un evento.', 'DIGITAL', 3.99, 7, false, true, 2, CURRENT_TIMESTAMP),
  ('addon_setup', 'professional-setup', 'Configuración profesional', 'Ayuda de configuración para tu negocio.', 'DELIVERY', 20, NULL, true, true, 3, CURRENT_TIMESTAMP),
  ('addon_qr_kit', 'qr-kit', 'Kit QR', 'Kit QR físico para tu local.', 'DELIVERY', 19, NULL, true, true, 4, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "BillingSetting" ("id", "simulationEnabled", "googlePhotoEnabled", "updatedAt")
VALUES ('global', true, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "BusinessAccount" ("id", "ownerId", "createdAt", "updatedAt")
SELECT 'account_' || md5(owner_id), owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT COALESCE(v."claimedBy", v."userId") AS owner_id FROM "Venue" v) owners
WHERE EXISTS (SELECT 1 FROM "User" u WHERE u."id" = owners.owner_id)
  AND NOT EXISTS (SELECT 1 FROM "BusinessAccount" a WHERE a."ownerId" = owners.owner_id);
INSERT INTO "BusinessMembership" ("id", "accountId", "userId", "role", "createdAt", "updatedAt")
SELECT 'membership_' || md5(a."id" || a."ownerId"), a."id", a."ownerId", 'OWNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "BusinessAccount" a
WHERE NOT EXISTS (SELECT 1 FROM "BusinessMembership" m WHERE m."accountId" = a."id" AND m."userId" = a."ownerId");
UPDATE "Venue" v SET "businessAccountId" = a."id"
FROM "BusinessAccount" a
WHERE COALESCE(v."claimedBy", v."userId") = a."ownerId" AND v."businessAccountId" IS NULL;
INSERT INTO "Subscription" ("id", "accountId", "planVersionId", "status", "cycle", "startsAt", "endsAt", "referencePrice", "mode", "source", "createdAt", "updatedAt")
SELECT 'subscription_free_' || md5(a."id"), a."id", 'plan_free_v1', 'ACTIVE', 'CUSTOM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '100 years', 0, 'SIMULATED', 'MIGRATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "BusinessAccount" a
WHERE NOT EXISTS (SELECT 1 FROM "Subscription" s WHERE s."accountId" = a."id" AND s."status" = 'ACTIVE');
