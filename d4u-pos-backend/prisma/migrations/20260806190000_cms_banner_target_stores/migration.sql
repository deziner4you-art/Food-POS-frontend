-- CmsBanner.target_stores: implicit many-to-many to Store, mirroring
-- MarketingCampaign.target_stores ("_CampaignStores") exactly -- empty =
-- brand-wide (shows on every branch of the brand), non-empty = scoped to
-- those specific branches.

-- CreateTable
CREATE TABLE "CmsBanner" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "buttonText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CmsBanner_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CmsBanner" ADD CONSTRAINT "CmsBanner_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "_BannerStores" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "_BannerStores_AB_unique" ON "_BannerStores"("A", "B");
CREATE INDEX "_BannerStores_B_index" ON "_BannerStores"("B");

ALTER TABLE "_BannerStores" ADD CONSTRAINT "_BannerStores_A_fkey" FOREIGN KEY ("A") REFERENCES "CmsBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_BannerStores" ADD CONSTRAINT "_BannerStores_B_fkey" FOREIGN KEY ("B") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
