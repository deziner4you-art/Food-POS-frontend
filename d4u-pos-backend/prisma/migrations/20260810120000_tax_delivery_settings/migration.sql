-- Per-branch Tax % + Delivery settings (CmsSettings), reusing the existing
-- per-store settings pattern instead of the dead Store/Brand.vat_percentage
-- fields. delivery_radius_km is display-only ("We deliver within Xkm") --
-- never enforced, no geocoding infra exists in this codebase.
-- CreateTable
CREATE TABLE "CmsSettings" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL DEFAULT 1,
    "store_id" INTEGER,
    "siteTitle" TEXT NOT NULL DEFAULT 'D4U Restaurant',
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "address" TEXT,
    "googleMapUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "whatsappNumber" TEXT,
    "twitterUrl" TEXT,
    "youtubeUrl" TEXT,
    "aboutText" TEXT,
    "companyText" TEXT,
    "tax_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "delivery_radius_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "min_order_free_delivery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "module_auth_enabled" BOOLEAN NOT NULL DEFAULT false,
    "module_kds_enabled" BOOLEAN NOT NULL DEFAULT true,
    "module_loyalty_enabled" BOOLEAN NOT NULL DEFAULT false,
    "module_payments_enabled" BOOLEAN NOT NULL DEFAULT false,
    "inventoryUnlockPinHash" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CmsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CmsSettings_store_id_key" ON "CmsSettings"("store_id");

-- AddForeignKey
ALTER TABLE "CmsSettings" ADD CONSTRAINT "CmsSettings_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CmsSettings" ADD CONSTRAINT "CmsSettings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
