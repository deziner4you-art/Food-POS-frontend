-- Per-branch Tax % + Delivery settings (CmsSettings), reusing the existing
-- per-store settings pattern instead of the dead Store/Brand.vat_percentage
-- fields. delivery_radius_km is display-only ("We deliver within Xkm") --
-- never enforced, no geocoding infra exists in this codebase.
ALTER TABLE "CmsSettings" ADD COLUMN "tax_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CmsSettings" ADD COLUMN "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CmsSettings" ADD COLUMN "delivery_radius_km" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CmsSettings" ADD COLUMN "min_order_free_delivery" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Tax/delivery amounts locked in at order-creation time. Both default to 0,
-- so every historical order (placed before this feature existed) reads as
-- tax_amount=0/delivery_fee=0 -- their total_amount is NOT recalculated or
-- touched by this migration.
ALTER TABLE "Order" ADD COLUMN "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "OnlineOrder" ADD COLUMN "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "OnlineOrder" ADD COLUMN "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Every branch's POS/website today shows a hardcoded, client-side-only 10%
-- tax rate. Backfill every existing branch's new tax_percentage to 10 so
-- switching the client to read this real per-branch field doesn't silently
-- drop every branch to 0% tax the moment this ships -- branches keep today's
-- effective rate until a Super Admin explicitly changes it in Admin.
UPDATE "CmsSettings" SET "tax_percentage" = 10;
