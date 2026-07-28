-- AlterTable MarketingCampaign
ALTER TABLE "MarketingCampaign"
  ADD COLUMN "campaign_type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
  ADD COLUMN "flat_discount_amount" DOUBLE PRECISION,
  ADD COLUMN "buy_product_id" INTEGER,
  ADD COLUMN "buy_qty" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "get_product_id" INTEGER,
  ADD COLUMN "reward_type" TEXT DEFAULT 'FREE',
  ADD COLUMN "reward_qty" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "published_qr" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "published_kiosk" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable CampaignAnalytics
ALTER TABLE "CampaignAnalytics" ADD COLUMN "free_items_given" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_buy_product_id_fkey" FOREIGN KEY ("buy_product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_get_product_id_fkey" FOREIGN KEY ("get_product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CampaignPublication" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignPublication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignPublication_campaign_id_idx" ON "CampaignPublication"("campaign_id");

-- AddForeignKey
ALTER TABLE "CampaignPublication" ADD CONSTRAINT "CampaignPublication_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
