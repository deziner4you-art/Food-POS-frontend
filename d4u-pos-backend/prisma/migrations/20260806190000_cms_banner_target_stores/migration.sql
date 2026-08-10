-- CmsBanner.target_stores: implicit many-to-many to Store, mirroring
-- MarketingCampaign.target_stores ("_CampaignStores") exactly -- empty =
-- brand-wide (shows on every branch of the brand), non-empty = scoped to
-- those specific branches.
CREATE TABLE "_BannerStores" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "_BannerStores_AB_unique" ON "_BannerStores"("A", "B");
CREATE INDEX "_BannerStores_B_index" ON "_BannerStores"("B");

ALTER TABLE "_BannerStores" ADD CONSTRAINT "_BannerStores_A_fkey" FOREIGN KEY ("A") REFERENCES "CmsBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_BannerStores" ADD CONSTRAINT "_BannerStores_B_fkey" FOREIGN KEY ("B") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
