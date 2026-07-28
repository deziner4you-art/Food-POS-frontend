-- AlterTable MarketingCampaign (Bundle/Combo, Free Gift, Happy Hours)
ALTER TABLE "MarketingCampaign"
  ADD COLUMN "bundle_price" DOUBLE PRECISION,
  ADD COLUMN "min_spend" DOUBLE PRECISION,
  ADD COLUMN "gift_product_id" INTEGER,
  ADD COLUMN "active_days" TEXT,
  ADD COLUMN "active_time_start" TEXT,
  ADD COLUMN "active_time_end" TEXT,
  ADD COLUMN "active_dates" TEXT,
  ADD COLUMN "show_countdown" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_gift_product_id_fkey" FOREIGN KEY ("gift_product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable (implicit m2m: MarketingCampaign <-> Product, bundle contents)
CREATE TABLE "_CampaignBundleProducts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "_CampaignBundleProducts_AB_unique" ON "_CampaignBundleProducts"("A", "B");
CREATE INDEX "_CampaignBundleProducts_B_index" ON "_CampaignBundleProducts"("B");

ALTER TABLE "_CampaignBundleProducts" ADD CONSTRAINT "_CampaignBundleProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CampaignBundleProducts" ADD CONSTRAINT "_CampaignBundleProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Order (Promotion Execution Engine attribution)
ALTER TABLE "Order"
  ADD COLUMN "promotion_id" INTEGER,
  ADD COLUMN "promotion_type" TEXT,
  ADD COLUMN "promotion_name" TEXT,
  ADD COLUMN "promotion_discount" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN "gift_items" JSONB,
  ADD COLUMN "bogo_items" JSONB,
  ADD COLUMN "bundle_id" INTEGER,
  ADD COLUMN "combo_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable PackageModule (SaaS feature-flag payload)
ALTER TABLE "PackageModule" ADD COLUMN "config" JSONB;
