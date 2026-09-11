-- The runtime resolves one owner account and one active subscription. Enforce
-- those invariants in PostgreSQL so concurrent requests cannot fork state.
CREATE UNIQUE INDEX "BusinessAccount_ownerId_key" ON "BusinessAccount"("ownerId");

CREATE UNIQUE INDEX "Subscription_one_active_per_account_key"
ON "Subscription"("accountId")
WHERE "status" = 'ACTIVE';
