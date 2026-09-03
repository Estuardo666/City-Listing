-- Native push targets (APNs today, FCM when Android ships). Additive: the
-- existing PushSubscription table keeps serving Web Push untouched.
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "locale" TEXT NOT NULL DEFAULT 'es',
    "appVersion" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");
CREATE INDEX "DeviceToken_userId_revokedAt_idx" ON "DeviceToken"("userId", "revokedAt");

ALTER TABLE "DeviceToken"
ADD CONSTRAINT "DeviceToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Per-channel and per-type notification flags. Everything defaults to true so
-- existing rows keep the behaviour they had when only `enabled` existed.
ALTER TABLE "NotificationPreference"
    ADD COLUMN "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "eventReminders" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "newFollowedVenuePost" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "reviewReply" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "claimUpdates" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "messageReceived" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "moderationUpdates" BOOLEAN NOT NULL DEFAULT true;
