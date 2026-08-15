-- Loyalty points earn rate + redemption value, now per-branch configurable
-- (CmsSettings) instead of hardcoded constants. Defaults exactly match the
-- previous hardcoded behavior (5 pts / Rs 100 earn, Rs 0.20/point redeem),
-- so no branch's effective rate changes until a Super Admin edits it.
ALTER TABLE "CmsSettings" ADD COLUMN "loyalty_points_per_purchase" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "CmsSettings" ADD COLUMN "loyalty_purchase_amount" DOUBLE PRECISION NOT NULL DEFAULT 100;
ALTER TABLE "CmsSettings" ADD COLUMN "loyalty_point_value" DOUBLE PRECISION NOT NULL DEFAULT 0.2;
