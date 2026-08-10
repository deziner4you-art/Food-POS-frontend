-- Loyalty Points redemption, locked in at order-creation time -- mirrors the
-- tax_amount/delivery_fee pattern. Both default to 0, so every historical
-- order reads as loyalty_discount=0/points_redeemed=0; their total_amount
-- is NOT recalculated or touched by this migration.
ALTER TABLE "Order" ADD COLUMN "loyalty_discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "points_redeemed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OnlineOrder" ADD COLUMN "loyalty_discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "OnlineOrder" ADD COLUMN "points_redeemed" INTEGER NOT NULL DEFAULT 0;
