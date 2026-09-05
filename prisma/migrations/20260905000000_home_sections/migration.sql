CREATE TABLE "HomeSection" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "actionLabel" TEXT,
  "layout" TEXT NOT NULL DEFAULT 'carousel',
  "params" JSONB NOT NULL DEFAULT '{}',
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "platform" TEXT NOT NULL DEFAULT 'all',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomeSection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HomeSection_platform_check" CHECK ("platform" IN ('all', 'ios', 'web'))
);
CREATE INDEX "HomeSection_isActive_order_idx" ON "HomeSection"("isActive", "order");
