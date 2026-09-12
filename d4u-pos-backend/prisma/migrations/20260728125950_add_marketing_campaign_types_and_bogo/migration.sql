-- CreateTable
CREATE TABLE "MarketingCampaign" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discount_pct" DOUBLE PRECISION NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "published_pos" BOOLEAN NOT NULL DEFAULT false,
    "published_web" BOOLEAN NOT NULL DEFAULT false,
    "published_social" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "scheduled_at" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "published_facebook" BOOLEAN NOT NULL DEFAULT false,
    "published_instagram" BOOLEAN NOT NULL DEFAULT false,
    "published_tv" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "allow_stacking" BOOLEAN NOT NULL DEFAULT false,
    "published_email" BOOLEAN NOT NULL DEFAULT false,
    "published_sms" BOOLEAN NOT NULL DEFAULT false,
    "published_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "published_push" BOOLEAN NOT NULL DEFAULT false,
    "ab_test_group" TEXT,
    "ab_test_parent_id" INTEGER,
    "campaign_type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "flat_discount_amount" DOUBLE PRECISION,
    "buy_product_id" INTEGER,
    "buy_qty" INTEGER NOT NULL DEFAULT 1,
    "get_product_id" INTEGER,
    "reward_type" TEXT DEFAULT 'FREE',
    "reward_qty" INTEGER NOT NULL DEFAULT 1,
    "published_qr" BOOLEAN NOT NULL DEFAULT false,
    "published_kiosk" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignAnalytics" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue_generated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "free_items_given" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CampaignAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CampaignStores" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_CampaignCategories" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_CampaignProducts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CampaignStores_AB_unique" ON "_CampaignStores"("A", "B");
CREATE INDEX "_CampaignStores_B_index" ON "_CampaignStores"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CampaignCategories_AB_unique" ON "_CampaignCategories"("A", "B");
CREATE INDEX "_CampaignCategories_B_index" ON "_CampaignCategories"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CampaignProducts_AB_unique" ON "_CampaignProducts"("A", "B");
CREATE INDEX "_CampaignProducts_B_index" ON "_CampaignProducts"("B");

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAnalytics" ADD CONSTRAINT "CampaignAnalytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignStores" ADD CONSTRAINT "_CampaignStores_A_fkey" FOREIGN KEY ("A") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CampaignStores" ADD CONSTRAINT "_CampaignStores_B_fkey" FOREIGN KEY ("B") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignCategories" ADD CONSTRAINT "_CampaignCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CampaignCategories" ADD CONSTRAINT "_CampaignCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignProducts" ADD CONSTRAINT "_CampaignProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CampaignProducts" ADD CONSTRAINT "_CampaignProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
