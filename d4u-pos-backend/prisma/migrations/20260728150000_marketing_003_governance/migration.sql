-- AlterTable MarketingCampaign (soft delete, versioning, approval workflow, cloning lineage)
ALTER TABLE "MarketingCampaign"
  ADD COLUMN "deleted_at" TIMESTAMP(3),
  ADD COLUMN "deleted_by" INTEGER,
  ADD COLUMN "archived_reason" TEXT,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "created_by" INTEGER,
  ADD COLUMN "updated_by" INTEGER,
  ADD COLUMN "approval_status" TEXT NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "rejection_reason" TEXT,
  ADD COLUMN "submitted_by" INTEGER,
  ADD COLUMN "approved_by" INTEGER,
  ADD COLUMN "approved_at" TIMESTAMP(3),
  ADD COLUMN "cloned_from_id" INTEGER;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_cloned_from_id_fkey" FOREIGN KEY ("cloned_from_id") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable CampaignVersion
CREATE TABLE "CampaignVersion" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "changed_by" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CampaignVersion_campaign_id_idx" ON "CampaignVersion"("campaign_id");

ALTER TABLE "CampaignVersion" ADD CONSTRAINT "CampaignVersion_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CampaignAuditLog" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "changes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "store_id" INTEGER,
    "ip_address" TEXT,
    "device" TEXT,
    "previous_value" TEXT,
    "new_value" TEXT,

    CONSTRAINT "CampaignAuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CampaignAuditLog" ADD CONSTRAINT "CampaignAuditLog_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Order (promotion-decision audit trail)
ALTER TABLE "Order"
  ADD COLUMN "applied_rules" JSONB,
  ADD COLUMN "rejected_promotions" JSONB,
  ADD COLUMN "manager_override_by" INTEGER,
  ADD COLUMN "coupon_blocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "loyalty_blocked" BOOLEAN NOT NULL DEFAULT false;
