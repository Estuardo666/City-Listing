-- Event ticketing foundation. Monetary values are integer cents, never floats.
ALTER TABLE "PlanVersion" ADD COLUMN "eventTicketingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlanVersion" ADD COLUMN "seatMapsEnabled" BOOLEAN NOT NULL DEFAULT false;
UPDATE "PlanVersion" pv SET "eventTicketingEnabled" = true FROM "Plan" p WHERE pv."planId" = p."id" AND p."slug" IN ('plus', 'pro', 'red');
UPDATE "PlanVersion" pv SET "seatMapsEnabled" = true FROM "Plan" p WHERE pv."planId" = p."id" AND p."slug" IN ('pro', 'red');

CREATE TABLE "OrganizerPaymentAccount" (
  "id" TEXT NOT NULL,
  "businessAccountId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'PAYPHONE',
  "displayName" TEXT,
  "merchantReference" TEXT,
  "storeId" TEXT NOT NULL,
  "credentialCiphertext" TEXT NOT NULL,
  "credentialIv" TEXT NOT NULL,
  "credentialAuthTag" TEXT NOT NULL,
  "credentialKeyVersion" INTEGER NOT NULL DEFAULT 1,
  "capabilities" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "lastVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizerPaymentAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventTicketingConfig" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'NONE',
  "sellerType" TEXT NOT NULL DEFAULT 'ORGANIZER',
  "paymentAccountId" TEXT,
  "externalUrl" TEXT,
  "externalProviderLabel" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "feeIncidence" TEXT NOT NULL DEFAULT 'NONE',
  "feePercentBps" INTEGER NOT NULL DEFAULT 0,
  "feeFixedCents" INTEGER NOT NULL DEFAULT 0,
  "salesStartAt" TIMESTAMP(3),
  "salesEndAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventTicketingConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketType" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "ticketingId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'GENERAL',
  "priceCents" INTEGER NOT NULL,
  "capacity" INTEGER,
  "heldCount" INTEGER NOT NULL DEFAULT 0,
  "soldCount" INTEGER NOT NULL DEFAULT 0,
  "minPerOrder" INTEGER NOT NULL DEFAULT 1,
  "maxPerOrder" INTEGER NOT NULL DEFAULT 10,
  "salesStartAt" TIMESTAMP(3),
  "salesEndAt" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventSeatMapVersion" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "ticketingId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "name" TEXT NOT NULL,
  "layout" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventSeatMapVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventSeat" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "seatMapId" TEXT NOT NULL,
  "ticketTypeId" TEXT,
  "seatKey" TEXT NOT NULL,
  "section" TEXT,
  "rowLabel" TEXT,
  "seatNumber" TEXT NOT NULL,
  "x" DOUBLE PRECISION NOT NULL,
  "y" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventSeat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketHold" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "ticketingId" TEXT NOT NULL,
  "publicTokenHash" TEXT NOT NULL,
  "publicTokenLast4" TEXT NOT NULL,
  "publicTokenCiphertext" TEXT,
  "publicTokenIv" TEXT,
  "publicTokenAuthTag" TEXT,
  "publicTokenKeyVersion" INTEGER,
  "sessionKey" TEXT NOT NULL,
  "idempotencyKey" TEXT,
  "buyerUserId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TicketHold_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketHoldItem" (
  "id" TEXT NOT NULL,
  "holdId" TEXT NOT NULL,
  "ticketTypeId" TEXT NOT NULL,
  "eventSeatId" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPriceCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketHoldItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketOrder" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "ticketingId" TEXT NOT NULL,
  "holdId" TEXT NOT NULL,
  "buyerUserId" TEXT,
  "sellerAccountId" TEXT,
  "publicTokenHash" TEXT NOT NULL,
  "publicTokenLast4" TEXT NOT NULL,
  "clientTransactionId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'PAYPHONE',
  "providerPaymentId" TEXT,
  "subtotalCents" INTEGER NOT NULL,
  "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL,
  "refundedCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "buyerName" TEXT NOT NULL,
  "buyerEmail" TEXT NOT NULL,
  "buyerPhone" TEXT NOT NULL,
  "billingDocumentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  "checkoutUrl" TEXT,
  "providerStatus" TEXT,
  "failureCode" TEXT,
  "paidAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TicketOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketOrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "ticketTypeId" TEXT NOT NULL,
  "eventSeatId" TEXT,
  "kindSnapshot" TEXT NOT NULL,
  "nameSnapshot" TEXT NOT NULL,
  "seatLabel" TEXT,
  "unitPriceCents" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "subtotalCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketPaymentAttempt" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "clientTransactionId" TEXT NOT NULL,
  "providerPaymentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "providerStatus" TEXT,
  "amountCents" INTEGER NOT NULL,
  "rawResponse" JSONB,
  "failureCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TicketPaymentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Ticket" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "ticketTypeId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "eventSeatId" TEXT,
  "code" TEXT NOT NULL,
  "qrTokenHash" TEXT NOT NULL,
  "qrTokenLast4" TEXT NOT NULL,
  "qrTokenCiphertext" TEXT NOT NULL,
  "qrTokenIv" TEXT NOT NULL,
  "qrTokenAuthTag" TEXT NOT NULL,
  "qrTokenKeyVersion" INTEGER NOT NULL DEFAULT 1,
  "seatLabel" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ISSUED',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkedInAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketCheckIn" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "scannerUserId" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "deviceId" TEXT,
  "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketRefund" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "processedById" TEXT,
  "amountCents" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerRef" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "failureCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TicketRefund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketingLedgerEntry" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "entryType" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketingLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketingOutbox" (
  "id" TEXT NOT NULL,
  "orderId" TEXT,
  "kind" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TicketingOutbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventTicketingStaff" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "permissions" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventTicketingStaff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketingAuditLog" (
  "id" TEXT NOT NULL,
  "eventId" TEXT,
  "orderId" TEXT,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketingAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizerPaymentAccount_businessAccountId_provider_storeId_key" ON "OrganizerPaymentAccount"("businessAccountId", "provider", "storeId");
CREATE INDEX "OrganizerPaymentAccount_businessAccountId_status_idx" ON "OrganizerPaymentAccount"("businessAccountId", "status");
CREATE UNIQUE INDEX "EventTicketingConfig_eventId_key" ON "EventTicketingConfig"("eventId");
CREATE INDEX "EventTicketingConfig_mode_status_idx" ON "EventTicketingConfig"("mode", "status");
CREATE INDEX "EventTicketingConfig_paymentAccountId_idx" ON "EventTicketingConfig"("paymentAccountId");
CREATE UNIQUE INDEX "TicketType_eventId_slug_key" ON "TicketType"("eventId", "slug");
CREATE INDEX "TicketType_ticketingId_isActive_sortOrder_idx" ON "TicketType"("ticketingId", "isActive", "sortOrder");
CREATE UNIQUE INDEX "EventSeatMapVersion_eventId_version_key" ON "EventSeatMapVersion"("eventId", "version");
CREATE INDEX "EventSeatMapVersion_ticketingId_status_idx" ON "EventSeatMapVersion"("ticketingId", "status");
CREATE UNIQUE INDEX "EventSeat_eventId_seatKey_key" ON "EventSeat"("eventId", "seatKey");
CREATE INDEX "EventSeat_seatMapId_status_idx" ON "EventSeat"("seatMapId", "status");
CREATE INDEX "EventSeat_ticketTypeId_status_idx" ON "EventSeat"("ticketTypeId", "status");
CREATE UNIQUE INDEX "TicketHold_publicTokenHash_key" ON "TicketHold"("publicTokenHash");
CREATE INDEX "TicketHold_eventId_status_expiresAt_idx" ON "TicketHold"("eventId", "status", "expiresAt");
CREATE INDEX "TicketHold_sessionKey_createdAt_idx" ON "TicketHold"("sessionKey", "createdAt");
CREATE UNIQUE INDEX "TicketHold_sessionKey_idempotencyKey_key" ON "TicketHold"("sessionKey", "idempotencyKey");
CREATE INDEX "TicketHoldItem_holdId_idx" ON "TicketHoldItem"("holdId");
CREATE INDEX "TicketHoldItem_ticketTypeId_idx" ON "TicketHoldItem"("ticketTypeId");
CREATE UNIQUE INDEX "TicketHoldItem_holdId_eventSeatId_key" ON "TicketHoldItem"("holdId", "eventSeatId");
CREATE UNIQUE INDEX "TicketOrder_holdId_key" ON "TicketOrder"("holdId");
CREATE UNIQUE INDEX "TicketOrder_publicTokenHash_key" ON "TicketOrder"("publicTokenHash");
CREATE UNIQUE INDEX "TicketOrder_clientTransactionId_key" ON "TicketOrder"("clientTransactionId");
CREATE INDEX "TicketOrder_eventId_status_createdAt_idx" ON "TicketOrder"("eventId", "status", "createdAt");
CREATE INDEX "TicketOrder_buyerUserId_createdAt_idx" ON "TicketOrder"("buyerUserId", "createdAt");
CREATE INDEX "TicketOrder_sellerAccountId_status_createdAt_idx" ON "TicketOrder"("sellerAccountId", "status", "createdAt");
CREATE INDEX "TicketOrder_provider_providerPaymentId_idx" ON "TicketOrder"("provider", "providerPaymentId");
CREATE INDEX "TicketOrderItem_orderId_idx" ON "TicketOrderItem"("orderId");
CREATE INDEX "TicketOrderItem_ticketTypeId_idx" ON "TicketOrderItem"("ticketTypeId");
CREATE INDEX "TicketPaymentAttempt_orderId_createdAt_idx" ON "TicketPaymentAttempt"("orderId", "createdAt");
CREATE INDEX "TicketPaymentAttempt_provider_providerPaymentId_idx" ON "TicketPaymentAttempt"("provider", "providerPaymentId");
CREATE UNIQUE INDEX "Ticket_code_key" ON "Ticket"("code");
CREATE UNIQUE INDEX "Ticket_qrTokenHash_key" ON "Ticket"("qrTokenHash");
CREATE INDEX "Ticket_eventId_status_idx" ON "Ticket"("eventId", "status");
CREATE INDEX "Ticket_orderId_idx" ON "Ticket"("orderId");
CREATE INDEX "TicketCheckIn_eventId_scannedAt_idx" ON "TicketCheckIn"("eventId", "scannedAt");
CREATE INDEX "TicketCheckIn_ticketId_scannedAt_idx" ON "TicketCheckIn"("ticketId", "scannedAt");
CREATE INDEX "TicketRefund_orderId_createdAt_idx" ON "TicketRefund"("orderId", "createdAt");
CREATE INDEX "TicketRefund_status_createdAt_idx" ON "TicketRefund"("status", "createdAt");
CREATE INDEX "TicketingLedgerEntry_orderId_createdAt_idx" ON "TicketingLedgerEntry"("orderId", "createdAt");
CREATE INDEX "TicketingLedgerEntry_entryType_createdAt_idx" ON "TicketingLedgerEntry"("entryType", "createdAt");
CREATE UNIQUE INDEX "TicketingOutbox_dedupeKey_key" ON "TicketingOutbox"("dedupeKey");
CREATE INDEX "TicketingOutbox_status_availableAt_idx" ON "TicketingOutbox"("status", "availableAt");
CREATE INDEX "TicketingOutbox_orderId_kind_idx" ON "TicketingOutbox"("orderId", "kind");
CREATE UNIQUE INDEX "EventTicketingStaff_eventId_userId_key" ON "EventTicketingStaff"("eventId", "userId");
CREATE INDEX "EventTicketingStaff_userId_eventId_idx" ON "EventTicketingStaff"("userId", "eventId");
CREATE INDEX "TicketingAuditLog_eventId_createdAt_idx" ON "TicketingAuditLog"("eventId", "createdAt");
CREATE INDEX "TicketingAuditLog_orderId_createdAt_idx" ON "TicketingAuditLog"("orderId", "createdAt");
CREATE INDEX "TicketingAuditLog_actorId_createdAt_idx" ON "TicketingAuditLog"("actorId", "createdAt");

ALTER TABLE "OrganizerPaymentAccount" ADD CONSTRAINT "OrganizerPaymentAccount_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "BusinessAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventTicketingConfig" ADD CONSTRAINT "EventTicketingConfig_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventTicketingConfig" ADD CONSTRAINT "EventTicketingConfig_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "OrganizerPaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketType" ADD CONSTRAINT "TicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketType" ADD CONSTRAINT "TicketType_ticketingId_fkey" FOREIGN KEY ("ticketingId") REFERENCES "EventTicketingConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventSeatMapVersion" ADD CONSTRAINT "EventSeatMapVersion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventSeatMapVersion" ADD CONSTRAINT "EventSeatMapVersion_ticketingId_fkey" FOREIGN KEY ("ticketingId") REFERENCES "EventTicketingConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventSeat" ADD CONSTRAINT "EventSeat_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventSeat" ADD CONSTRAINT "EventSeat_seatMapId_fkey" FOREIGN KEY ("seatMapId") REFERENCES "EventSeatMapVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventSeat" ADD CONSTRAINT "EventSeat_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketHold" ADD CONSTRAINT "TicketHold_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketHold" ADD CONSTRAINT "TicketHold_ticketingId_fkey" FOREIGN KEY ("ticketingId") REFERENCES "EventTicketingConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketHoldItem" ADD CONSTRAINT "TicketHoldItem_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "TicketHold"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketHoldItem" ADD CONSTRAINT "TicketHoldItem_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketHoldItem" ADD CONSTRAINT "TicketHoldItem_eventSeatId_fkey" FOREIGN KEY ("eventSeatId") REFERENCES "EventSeat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketOrder" ADD CONSTRAINT "TicketOrder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketOrder" ADD CONSTRAINT "TicketOrder_ticketingId_fkey" FOREIGN KEY ("ticketingId") REFERENCES "EventTicketingConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketOrder" ADD CONSTRAINT "TicketOrder_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "TicketHold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketOrder" ADD CONSTRAINT "TicketOrder_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketOrder" ADD CONSTRAINT "TicketOrder_sellerAccountId_fkey" FOREIGN KEY ("sellerAccountId") REFERENCES "BusinessAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketHold" ADD CONSTRAINT "TicketHold_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketOrderItem" ADD CONSTRAINT "TicketOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketOrderItem" ADD CONSTRAINT "TicketOrderItem_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketOrderItem" ADD CONSTRAINT "TicketOrderItem_eventSeatId_fkey" FOREIGN KEY ("eventSeatId") REFERENCES "EventSeat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketPaymentAttempt" ADD CONSTRAINT "TicketPaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "TicketOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventSeatId_fkey" FOREIGN KEY ("eventSeatId") REFERENCES "EventSeat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketCheckIn" ADD CONSTRAINT "TicketCheckIn_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketCheckIn" ADD CONSTRAINT "TicketCheckIn_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketCheckIn" ADD CONSTRAINT "TicketCheckIn_scannerUserId_fkey" FOREIGN KEY ("scannerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketRefund" ADD CONSTRAINT "TicketRefund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketRefund" ADD CONSTRAINT "TicketRefund_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketingLedgerEntry" ADD CONSTRAINT "TicketingLedgerEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketingOutbox" ADD CONSTRAINT "TicketingOutbox_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventTicketingStaff" ADD CONSTRAINT "EventTicketingStaff_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventTicketingStaff" ADD CONSTRAINT "EventTicketingStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketingAuditLog" ADD CONSTRAINT "TicketingAuditLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketingAuditLog" ADD CONSTRAINT "TicketingAuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketingAuditLog" ADD CONSTRAINT "TicketingAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
