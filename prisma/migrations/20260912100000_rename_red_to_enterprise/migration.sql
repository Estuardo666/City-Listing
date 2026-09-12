-- Keep the existing plan row and all historical relations, changing only its
-- public identity. PlanVersion, Order and Subscription rows remain intact.
UPDATE "Plan"
SET "slug" = 'enterprise', "name" = 'Enterprise'
WHERE "slug" = 'red';
