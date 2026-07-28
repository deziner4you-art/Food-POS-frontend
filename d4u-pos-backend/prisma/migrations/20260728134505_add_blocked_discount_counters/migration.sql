-- AlterTable
ALTER TABLE "CampaignAnalytics"
  ADD COLUMN "blocked_coupons" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "blocked_loyalty" INTEGER NOT NULL DEFAULT 0;
